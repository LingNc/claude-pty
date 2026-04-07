import { lifecycleManager } from './session-lifecycle.js'
import { notificationManager } from './notification-manager.js'
import { outputManager } from './output-manager.js'
import type {
  PTYSession,
  PTYSessionInfo,
  SpawnOptions,
  ReadResult,
  SearchResult,
} from './types.js'

/**
 * Notify function type for sending notifications to Claude Code
 */
export type NotifyFn = (message: string) => void

/**
 * Callback types for session events
 */
export type SessionUpdateCallback = (session: PTYSessionInfo) => void
export type RawOutputCallback = (session: PTYSessionInfo, rawData: string) => void

// Global callback arrays
const sessionUpdateCallbacks: SessionUpdateCallback[] = []
const rawOutputCallbacks: RawOutputCallback[] = []

/**
 * Register a callback for session update events
 */
export function registerSessionUpdateCallback(callback: SessionUpdateCallback): void {
  sessionUpdateCallbacks.push(callback)
}

/**
 * Remove a session update callback
 */
export function removeSessionUpdateCallback(callback: SessionUpdateCallback): void {
  const index = sessionUpdateCallbacks.indexOf(callback)
  if (index !== -1) {
    sessionUpdateCallbacks.splice(index, 1)
  }
}

/**
 * Register a callback for raw output events
 */
export function registerRawOutputCallback(callback: RawOutputCallback): void {
  rawOutputCallbacks.push(callback)
}

/**
 * Remove a raw output callback
 */
export function removeRawOutputCallback(callback: RawOutputCallback): void {
  const index = rawOutputCallbacks.indexOf(callback)
  if (index !== -1) {
    rawOutputCallbacks.splice(index, 1)
  }
}

/**
 * Notify all registered session update callbacks
 */
function notifySessionUpdate(session: PTYSessionInfo): void {
  for (const callback of sessionUpdateCallbacks) {
    try {
      callback(session)
    } catch {
      // Ignore callback errors
    }
  }
}

/**
 * Notify all registered raw output callbacks
 */
function notifyRawOutput(session: PTYSessionInfo, rawData: string): void {
  for (const callback of rawOutputCallbacks) {
    try {
      callback(session, rawData)
    } catch {
      // Ignore callback errors
    }
  }
}

/**
 * PTY Manager - Central coordinator for all PTY operations
 * Integrates lifecycle, notification, and output management
 */
class PTYManager {
  private notifyFn: NotifyFn | null = null

  /**
   * Set the notify function for sending exit notifications
   * In Claude Code plugin, this comes from context.notify
   */
  setNotifyFn(notifyFn: NotifyFn): void {
    this.notifyFn = notifyFn
  }

  /**
   * Spawn a new PTY session
   */
  spawn(opts: SpawnOptions): PTYSessionInfo {
    const session = lifecycleManager.spawn(
      opts,
      (session, data) => {
        // Data callback - notify raw output subscribers
        notifyRawOutput(lifecycleManager.toInfo(session), data)
      },
      (session, exitCode) => {
        // Exit callback - send notification if requested
        const sessionInfo = lifecycleManager.toInfo(session)
        notifySessionUpdate(sessionInfo)
        if (session.notifyOnExit && this.notifyFn) {
          notificationManager.sendExitNotification(session, exitCode || 0, this.notifyFn)
        }
      }
    )
    notifySessionUpdate(session)
    return session
  }

  /**
   * Write data to a PTY session
   */
  write(id: string, data: string): boolean {
    const session = lifecycleManager.getSession(id)
    if (!session) {
      return false
    }
    return outputManager.write(session, data)
  }

  /**
   * Read lines from a PTY session
   */
  read(id: string, offset: number = 0, limit?: number): ReadResult | null {
    const session = lifecycleManager.getSession(id)
    if (!session) {
      return null
    }
    return outputManager.read(session, offset, limit)
  }

  /**
   * Search for pattern in a PTY session
   */
  search(id: string, pattern: RegExp, offset: number = 0, limit?: number): SearchResult | null {
    const session = lifecycleManager.getSession(id)
    if (!session) {
      return null
    }
    return outputManager.search(session, pattern, offset, limit)
  }

  /**
   * List all sessions
   */
  list(): PTYSessionInfo[] {
    return lifecycleManager.listSessions().map((s) => lifecycleManager.toInfo(s))
  }

  /**
   * Get a session by ID
   */
  get(id: string): PTYSessionInfo | null {
    const session = lifecycleManager.getSession(id)
    if (!session) {
      return null
    }
    return lifecycleManager.toInfo(session)
  }

  /**
   * Get raw buffer content for a session
   */
  getRawBuffer(id: string): { raw: string; byteLength: number } | null {
    const session = lifecycleManager.getSession(id)
    if (!session) {
      return null
    }
    return {
      raw: session.buffer.readRaw(),
      byteLength: session.buffer.byteLength,
    }
  }

  /**
   * Kill a session
   */
  kill(id: string, cleanup: boolean = false): boolean {
    return lifecycleManager.kill(id, cleanup)
  }

  /**
   * Clean up sessions by parent session ID
   */
  cleanupBySession(parentSessionId: string): void {
    lifecycleManager.cleanupBySession(parentSessionId)
  }

  /**
   * Clear all sessions
   */
  clearAllSessions(): void {
    lifecycleManager.clearAllSessions()
  }
}

// Export singleton instance
export const manager = new PTYManager()
