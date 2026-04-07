import { PTYServer } from '../web/server/server.js';
/**
 * Get or create the PTY server instance
 */
export declare function getOrCreateServer(): Promise<PTYServer>;
/**
 * Get the current server URL if available
 */
export declare function getServerUrl(): string | null;
/**
 * Close the PTY server if running
 */
export declare function closeServer(): void;
/**
 * PTY Open command - Opens the Web UI for PTY sessions
 */
export declare const ptyOpenCommand: any;
/**
 * PTY Show URL command - Display the current Web UI URL
 */
export declare const ptyShowUrlCommand: any;
//# sourceMappingURL=pty-open.d.ts.map