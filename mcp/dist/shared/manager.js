import { manager as originalManager } from '../pty/manager.js';
import { lifecycleManager } from '../pty/session-lifecycle.js';
import { notificationManager } from './notification-manager.js';
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
    spawn(opts) {
        const session = lifecycleManager.spawn(opts, (session, data) => {
            // Data callback - could be used for real-time streaming in future
            // For now, just buffer the data
        }, (session, exitCode) => {
            // Exit callback - send notification via stderr if requested
            if (session.notifyOnExit) {
                notificationManager.sendExitNotification(session, exitCode || 0);
            }
        });
        return session;
    }
    /**
     * Write data to a PTY session
     */
    write(id, data) {
        return originalManager.write(id, data);
    }
    /**
     * Read lines from a PTY session
     */
    read(id, offset = 0, limit) {
        return originalManager.read(id, offset, limit);
    }
    /**
     * Search for pattern in a PTY session
     */
    search(id, pattern, offset = 0, limit) {
        return originalManager.search(id, pattern, offset, limit);
    }
    /**
     * List all sessions
     */
    list() {
        return originalManager.list();
    }
    /**
     * Get a session by ID
     */
    get(id) {
        return originalManager.get(id);
    }
    /**
     * Kill a session
     */
    kill(id, cleanup = false) {
        return originalManager.kill(id, cleanup);
    }
}
// Export singleton instance
export const manager = new MCPManager();
//# sourceMappingURL=manager.js.map