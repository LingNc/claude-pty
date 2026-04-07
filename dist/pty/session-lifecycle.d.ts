import type { PTYSession, PTYSessionInfo, SpawnOptions } from './types.js';
/**
 * Callback for data events
 */
export type DataCallback = (session: PTYSession, data: string) => void;
/**
 * Callback for exit events
 */
export type ExitCallback = (session: PTYSession, exitCode: number | null) => void;
/**
 * Manages the lifecycle of PTY sessions.
 * Handles creation, destruction, and event management for terminal sessions.
 */
export declare class SessionLifecycleManager {
    private sessions;
    /**
     * Create a session object (without spawning process)
     */
    private createSessionObject;
    /**
     * Spawn the PTY process for a session
     */
    private spawnProcess;
    /**
     * Set up event handlers for a session
     */
    private setupEventHandlers;
    /**
     * Spawn a new PTY session
     * @param opts - Spawn options
     * @param onData - Callback for data events
     * @param onExit - Callback for exit events
     * @returns Session info object
     */
    spawn(opts: SpawnOptions, onData: DataCallback, onExit: ExitCallback): PTYSessionInfo;
    /**
     * Kill a session
     * @param id - Session ID
     * @param cleanup - Whether to clean up session data
     * @returns true if session was found and killed
     */
    kill(id: string, cleanup?: boolean): boolean;
    /**
     * Clear all sessions (internal)
     */
    private clearAllSessionsInternal;
    /**
     * Clear all sessions
     */
    clearAllSessions(): void;
    /**
     * Clean up sessions by parent session ID
     * @param parentSessionId - Parent session ID to match
     */
    cleanupBySession(parentSessionId: string): void;
    /**
     * Get a session by ID
     * @param id - Session ID
     * @returns Session or null if not found
     */
    getSession(id: string): PTYSession | null;
    /**
     * List all sessions
     * @returns Array of all sessions
     */
    listSessions(): PTYSession[];
    /**
     * Convert session to serializable info object
     * @param session - Session to convert
     * @returns Session info object
     */
    toInfo(session: PTYSession): PTYSessionInfo;
}
export declare const lifecycleManager: SessionLifecycleManager;
//# sourceMappingURL=session-lifecycle.d.ts.map