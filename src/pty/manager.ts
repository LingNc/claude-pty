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
      (_session, _data) => {
        // Data callback - currently no-op, buffer handles data storage
      },
      (session, exitCode) => {
        // Exit callback - send notification if requested
        if (session.notifyOnExit && this.notifyFn) {
          notificationManager.sendExitNotification(session, exitCode || 0, this.notifyFn)
        }
      }
    )
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
