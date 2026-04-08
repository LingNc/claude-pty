import { lifecycleManager } from './session-lifecycle.js';
import { notificationManager } from './notification-manager.js';
import { outputManager } from './output-manager.js';
// Global callback arrays
const sessionUpdateCallbacks = [];
const rawOutputCallbacks = [];
/**
 * Register a callback for session update events
 */
export function registerSessionUpdateCallback(callback) {
    sessionUpdateCallbacks.push(callback);
}
/**
 * Remove a session update callback
 */
export function removeSessionUpdateCallback(callback) {
    const index = sessionUpdateCallbacks.indexOf(callback);
    if (index !== -1) {
        sessionUpdateCallbacks.splice(index, 1);
    }
}
/**
 * Register a callback for raw output events
 */
export function registerRawOutputCallback(callback) {
    rawOutputCallbacks.push(callback);
}
/**
 * Remove a raw output callback
 */
export function removeRawOutputCallback(callback) {
    const index = rawOutputCallbacks.indexOf(callback);
    if (index !== -1) {
        rawOutputCallbacks.splice(index, 1);
    }
}
/**
 * Notify all registered session update callbacks
 */
function notifySessionUpdate(session) {
    for (const callback of sessionUpdateCallbacks) {
        try {
            callback(session);
        }
        catch {
            // Ignore callback errors
        }
    }
}
/**
 * Notify all registered raw output callbacks
 */
function notifyRawOutput(session, rawData) {
    for (const callback of rawOutputCallbacks) {
        try {
            callback(session, rawData);
        }
        catch {
            // Ignore callback errors
        }
    }
}
/**
 * PTY Manager - Central coordinator for all PTY operations
 * Integrates lifecycle, notification, and output management
 */
class PTYManager {
    notifyFn = null;
    /**
     * Set the notify function for sending exit notifications
     * In Claude Code plugin, this comes from context.notify
     */
    setNotifyFn(notifyFn) {
        this.notifyFn = notifyFn;
    }
    /**
     * Spawn a new PTY session
     */
    spawn(opts) {
        const session = lifecycleManager.spawn(opts, (session, data) => {
            // Data callback - notify raw output subscribers
            notifyRawOutput(lifecycleManager.toInfo(session), data);
        }, (session, exitCode) => {
            // Exit callback - send notification if requested
            const sessionInfo = lifecycleManager.toInfo(session);
            notifySessionUpdate(sessionInfo);
            if (session.notifyOnExit && this.notifyFn) {
                notificationManager.sendExitNotification(session, exitCode || 0, this.notifyFn);
            }
        });
        notifySessionUpdate(session);
        return session;
    }
    /**
     * Write data to a PTY session
     */
    write(id, data) {
        const session = lifecycleManager.getSession(id);
        if (!session) {
            return false;
        }
        return outputManager.write(session, data);
    }
    /**
     * Read lines from a PTY session
     */
    read(id, offset = 0, limit) {
        const session = lifecycleManager.getSession(id);
        if (!session) {
            return null;
        }
        return outputManager.read(session, offset, limit);
    }
    /**
     * Search for pattern in a PTY session
     */
    search(id, pattern, offset = 0, limit) {
        const session = lifecycleManager.getSession(id);
        if (!session) {
            return null;
        }
        return outputManager.search(session, pattern, offset, limit);
    }
    /**
     * List all sessions
     */
    list() {
        return lifecycleManager.listSessions().map((s) => lifecycleManager.toInfo(s));
    }
    /**
     * Get a session by ID
     */
    get(id) {
        const session = lifecycleManager.getSession(id);
        if (!session) {
            return null;
        }
        return lifecycleManager.toInfo(session);
    }
    /**
     * Get raw buffer content for a session
     */
    getRawBuffer(id) {
        const session = lifecycleManager.getSession(id);
        if (!session) {
            return null;
        }
        return {
            raw: session.buffer.readRaw(),
            byteLength: session.buffer.byteLength,
        };
    }
    /**
     * Kill a session
     */
    kill(id, cleanup = false) {
        return lifecycleManager.kill(id, cleanup);
    }
    /**
     * Clean up sessions by parent session ID
     */
    cleanupBySession(parentSessionId) {
        lifecycleManager.cleanupBySession(parentSessionId);
    }
    /**
     * Clear all sessions
     */
    clearAllSessions() {
        lifecycleManager.clearAllSessions();
    }
}
// Export singleton instance
export const manager = new PTYManager();
//# sourceMappingURL=manager.js.map