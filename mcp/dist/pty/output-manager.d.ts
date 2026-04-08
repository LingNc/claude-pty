import type { PTYSession, ReadResult, SearchResult } from './types.js';
/**
 * Manages output operations for PTY sessions.
 * Handles writing to sessions and reading/searching output buffers.
 */
export declare class OutputManager {
    /**
     * Write data to a PTY session
     * @param session - Target PTY session
     * @param data - Data to write
     * @returns true if write succeeded
     */
    write(session: PTYSession, data: string): boolean;
    /**
     * Read lines from session buffer
     * @param session - Source PTY session
     * @param offset - Line offset to start from
     * @param limit - Maximum lines to read
     * @returns Read result with lines and pagination info
     */
    read(session: PTYSession, offset?: number, limit?: number): ReadResult;
    /**
     * Search for pattern in session buffer
     * @param session - Source PTY session
     * @param pattern - Regex pattern to search
     * @param offset - Match offset to start from
     * @param limit - Maximum matches to return
     * @returns Search result with matches and pagination info
     */
    search(session: PTYSession, pattern: RegExp, offset?: number, limit?: number): SearchResult;
}
export declare const outputManager: OutputManager;
//# sourceMappingURL=output-manager.d.ts.map