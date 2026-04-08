import type { PTYSession } from '../pty/types.js';
/**
 * Notification Manager for MCP
 * In MCP context, notifications are sent via stderr (console.error)
 * instead of context.notify
 */
export declare class NotificationManager {
    /**
     * Send exit notification via stderr
     * In MCP: Uses console.error instead of notify function
     */
    sendExitNotification(session: PTYSession, exitCode: number): Promise<void>;
    private buildExitNotification;
}
export declare const notificationManager: NotificationManager;
//# sourceMappingURL=notification-manager.d.ts.map