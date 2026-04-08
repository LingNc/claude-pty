import type { PTYSession } from './types.js';
/**
 * Manages exit notifications for PTY sessions
 */
export declare class NotificationManager {
    sendExitNotification(session: PTYSession, exitCode: number, notifyFn: (message: string) => void): Promise<void>;
    private buildExitNotification;
}
export declare const notificationManager: NotificationManager;
//# sourceMappingURL=notification-manager.d.ts.map