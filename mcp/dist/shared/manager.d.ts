import type { SpawnOptions, PTYSessionInfo, ReadResult, SearchResult } from '../pty/types.js';
/**
 * MCP PTY Manager Wrapper
 *
 * Wraps the original PTY manager and adapts notification handling for MCP.
 * In MCP, notifications are sent via stderr (console.error) instead of
 * the Claude Code context.notify function.
 */
declare class MCPManager {
    /**
     * Spawn a new PTY session with MCP notification handling
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
     * Kill a session
     */
    kill(id: string, cleanup?: boolean): boolean;
}
export declare const manager: MCPManager;
export {};
//# sourceMappingURL=manager.d.ts.map