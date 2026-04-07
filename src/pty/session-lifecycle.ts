import { spawn, type IPty, Terminal } from 'bun-pty'
import { version as bunPtyVersion } from 'bun-pty/package.json'
import { RingBuffer } from './buffer.js'
import type { PTYSession, PTYSessionInfo, SpawnOptions } from './types.js'

// Monkey-patch bun-pty to fix race condition in _startReadLoop
// Temporary workaround until https://github.com/sursaone/bun-pty/pull/37 is merged
function semverOrder(v1: string, v2: string): number {
  const parts1 = v1.split('.').map(Number)
  const parts2 = v2.split('.').map(Number)
  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const a = parts1[i] || 0
    const b = parts2[i] || 0
    if (a !== b) return a - b
  }
  return 0
}

if (semverOrder(bunPtyVersion, '0.4.8') > 0) {
  throw new Error(
    `bun-pty version ${bunPtyVersion} is too new for patching; remove the workaround.`
  )
}

const proto = Terminal.prototype as unknown as { _startReadLoop?: (...args: unknown[]) => unknown }
const original = proto._startReadLoop

if (typeof original === 'function') {
  proto._startReadLoop = async function (this: InstanceType<typeof Terminal>, ...args: unknown[]) {
    await Promise.resolve() // Yield to allow event handlers to be registered
    return original.apply(this, args)
  }
}

const SESSION_ID_BYTE_LENGTH = 4

// Default terminal dimensions
const DEFAULT_TERMINAL_COLS = 120
const DEFAULT_TERMINAL_ROWS = 30

/**
 * Generate a unique session ID
 */
function generateId(): string {
  const hex = Array.from(crypto.getRandomValues(new Uint8Array(SESSION_ID_BYTE_LENGTH)))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
  return `pty_${hex}`
}

/**
 * Callback for data events
 */
export type DataCallback = (session: PTYSession, data: string) => void

/**
 * Callback for exit events
 */
export type ExitCallback = (session: PTYSession, exitCode: number | null) => void

/**
 * Manages the lifecycle of PTY sessions.
 * Handles creation, destruction, and event management for terminal sessions.
 */
export class SessionLifecycleManager {
  private sessions: Map<string, PTYSession> = new Map()

  /**
   * Create a session object (without spawning process)
   */
  private createSessionObject(opts: SpawnOptions): PTYSession {
    const id = generateId()
    const args = opts.args ?? []
    const workdir = opts.workdir ?? process.cwd()
    const title =
      opts.title ?? (`${opts.command} ${args.join(' ')}`.trim() || `Terminal ${id.slice(-4)}`)

    const buffer = new RingBuffer()
    return {
      id,
      title,
      description: opts.description,
      command: opts.command,
      args,
      workdir,
      env: opts.env,
      status: 'running',
      pid: 0, // will be set after spawn
      createdAt: new Date(),
      parentSessionId: opts.parentSessionId,
      parentAgent: opts.parentAgent,
      notifyOnExit: opts.notifyOnExit ?? false,
      buffer,
      process: null, // will be set
    }
  }

  /**
   * Spawn the PTY process for a session
   */
  private spawnProcess(session: PTYSession): void {
    const env = { ...process.env, ...session.env } as Record<string, string>
    const ptyProcess: IPty = spawn(session.command, session.args, {
      name: 'xterm-256color',
      cols: DEFAULT_TERMINAL_COLS,
      rows: DEFAULT_TERMINAL_ROWS,
      cwd: session.workdir,
      env,
    })
    session.process = ptyProcess
    session.pid = ptyProcess.pid
  }

  /**
   * Set up event handlers for a session
   */
  private setupEventHandlers(
    session: PTYSession,
    onData: DataCallback,
    onExit: ExitCallback
  ): void {
    session.process?.onData((data: string) => {
      session.buffer.append(data)
      onData(session, data)
    })

    session.process?.onExit(({ exitCode, signal }) => {
      // Flush any remaining incomplete line in the buffer
      session.buffer.flush()

      if (session.status === 'killing') {
        session.status = 'killed'
      } else {
        session.status = 'exited'
      }
      session.exitCode = exitCode
      session.exitSignal = signal
      onExit(session, exitCode)
    })
  }

  /**
   * Spawn a new PTY session
   * @param opts - Spawn options
   * @param onData - Callback for data events
   * @param onExit - Callback for exit events
   * @returns Session info object
   */
  spawn(opts: SpawnOptions, onData: DataCallback, onExit: ExitCallback): PTYSessionInfo {
    const session = this.createSessionObject(opts)
    this.spawnProcess(session)
    this.setupEventHandlers(session, onData, onExit)
    this.sessions.set(session.id, session)
    return this.toInfo(session)
  }

  /**
   * Kill a session
   * @param id - Session ID
   * @param cleanup - Whether to clean up session data
   * @returns true if session was found and killed
   */
  kill(id: string, cleanup: boolean = false): boolean {
    const session = this.sessions.get(id)
    if (!session) {
      return false
    }

    if (session.status === 'running') {
      session.status = 'killing'
      try {
        session.process?.kill()
      } catch {
        // Ignore kill errors
      }
    }

    if (cleanup) {
      session.buffer.clear()
      this.sessions.delete(id)
    }

    return true
  }

  /**
   * Clear all sessions (internal)
   */
  private clearAllSessionsInternal(): void {
    for (const id of [...this.sessions.keys()]) {
      this.kill(id, true)
    }
  }

  /**
   * Clear all sessions
   */
  clearAllSessions(): void {
    this.clearAllSessionsInternal()
  }

  /**
   * Clean up sessions by parent session ID
   * @param parentSessionId - Parent session ID to match
   */
  cleanupBySession(parentSessionId: string): void {
    for (const [id, session] of this.sessions) {
      if (session.parentSessionId === parentSessionId) {
        this.kill(id, true)
      }
    }
  }

  /**
   * Get a session by ID
   * @param id - Session ID
   * @returns Session or null if not found
   */
  getSession(id: string): PTYSession | null {
    return this.sessions.get(id) || null
  }

  /**
   * List all sessions
   * @returns Array of all sessions
   */
  listSessions(): PTYSession[] {
    return Array.from(this.sessions.values())
  }

  /**
   * Convert session to serializable info object
   * @param session - Session to convert
   * @returns Session info object
   */
  toInfo(session: PTYSession): PTYSessionInfo {
    return {
      id: session.id,
      title: session.title,
      description: session.description,
      command: session.command,
      args: session.args,
      workdir: session.workdir,
      status: session.status,
      notifyOnExit: session.notifyOnExit,
      exitCode: session.exitCode,
      exitSignal: session.exitSignal,
      pid: session.pid,
      createdAt: session.createdAt.toISOString(),
      lineCount: session.buffer.length,
    }
  }
}

// Export singleton instance
export const lifecycleManager = new SessionLifecycleManager()
