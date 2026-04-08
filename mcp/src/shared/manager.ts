import { manager as originalManager } from '../pty/manager.js';
import { lifecycleManager } from '../pty/session-lifecycle.js';
import { notificationManager } from './notification-manager.js';
import type { SpawnOptions, PTYSessionInfo, ReadResult, SearchResult } from '../pty/types.js';

/**
 * MCP PTY Manager Wrapper
 *
 * Wraps the original PTY manager and adapts notification handling for MCP.
 * In MCP, notifications are sent via stderr (console.error) instead of
 * the Claude Code context.notify function.
 */
class MCPManager {
  /**
   * Spawn a new PTY session with MCP notification handling
   */
  spawn(opts: SpawnOptions): PTYSessionInfo {
    const session = lifecycleManager.spawn(
      opts,
      (session, data) => {
        // Data callback - could be used for real-time streaming in future
        // For now, just buffer the data
      },
      (session, exitCode) => {
        // Exit callback - send notification via stderr if requested
        if (session.notifyOnExit) {
          notificationManager.sendExitNotification(session, exitCode || 0);
        }
      }
    );
    return session;
  }

  /**
   * Write data to a PTY session
   */
  write(id: string, data: string): boolean {
    return originalManager.write(id, data);
  }

  /**
   * Read lines from a PTY session
   */
  read(id: string, offset: number = 0, limit?: number): ReadResult | null {
    return originalManager.read(id, offset, limit);
  }

  /**
   * Search for pattern in a PTY session
   */
  search(id: string, pattern: RegExp, offset: number = 0, limit?: number): SearchResult | null {
    return originalManager.search(id, pattern, offset, limit);
  }

  /**
   * List all sessions
   */
  list(): PTYSessionInfo[] {
    return originalManager.list();
  }

  /**
   * Get a session by ID
   */
  get(id: string): PTYSessionInfo | null {
    return originalManager.get(id);
  }

  /**
   * Kill a session
   */
  kill(id: string, cleanup: boolean = false): boolean {
    return originalManager.kill(id, cleanup);
  }
}

// Export singleton instance
export const manager = new MCPManager();
