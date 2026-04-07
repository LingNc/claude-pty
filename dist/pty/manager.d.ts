import type { PTYSessionInfo, SpawnOptions, ReadResult, SearchResult } from './types.js';
/**
 * Notify function type for sending notifications to Claude Code
 */
export type NotifyFn = (message: string) => void;
/**
 * Callback types for session events
 */
export type SessionUpdateCallback = (session: PTYSessionInfo) => void;
export type RawOutputCallback = (session: PTYSessionInfo, rawData: string) => void;
/**
 * Register a callback for session update events
 */
export declare function registerSessionUpdateCallback(callback: SessionUpdateCallback): void;
/**
 * Remove a session update callback
 */
export declare function removeSessionUpdateCallback(callback: SessionUpdateCallback): void;
/**
 * Register a callback for raw output events
 */
export declare function registerRawOutputCallback(callback: RawOutputCallback): void;
/**
 * Remove a raw output callback
 */
export declare function removeRawOutputCallback(callback: RawOutputCallback): void;
/**
 * PTY Manager - Central coordinator for all PTY operations
 * Integrates lifecycle, notification, and output management
 */
declare class PTYManager {
    private notifyFn;
    /**
     * Set the notify function for sending exit notifications
     * In Claude Code plugin, this comes from context.notify
     */
    setNotifyFn(notifyFn: NotifyFn): void;
    /**
     * Spawn a new PTY session
     */
    spawn(opts: SpawnOptions): PTYSessionInfo;
    /**
     * Write data to a PTY session
     */
    write(id: string, data: string): boolean;
    /**
     * Read lines from a PTY session
     */
    read(id: string, offset?: number, limit?: number): ReadResult | null;
    /**
     * Search for pattern in a PTY session
     */
    search(id: string, pattern: RegExp, offset?: number, limit?: number): SearchResult | null;
    /**
     * List all sessions
     */
    list(): PTYSessionInfo[];
    /**
     * Get a session by ID
     */
    get(id: string): PTYSessionInfo | null;
    /**
     * Get raw buffer content for a session
     */
    getRawBuffer(id: string): {
        raw: string;
        byteLength: number;
    } | null;
    /**
     * Kill a session
     */
    kill(id: string, cleanup?: boolean): boolean;
    /**
     * Clean up sessions by parent session ID
     */
    cleanupBySession(parentSessionId: string): void;
    /**
     * Clear all sessions
     */
    clearAllSessions(): void;
}
export declare const manager: PTYManager;
export {};
//# sourceMappingURL=manager.d.ts.map