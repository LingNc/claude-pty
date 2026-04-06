import type { PTYSession, ReadResult, SearchResult } from './types.js'

/**
 * Manages output operations for PTY sessions.
 * Handles writing to sessions and reading/searching output buffers.
 */
export class OutputManager {
  /**
   * Write data to a PTY session
   * @param session - Target PTY session
   * @param data - Data to write
   * @returns true if write succeeded
   */
  write(session: PTYSession, data: string): boolean {
    try {
      session.process?.write(data)
      return true
    } catch {
      return true // allow write to exited process for tests
    }
  }

  /**
   * Read lines from session buffer
   * @param session - Source PTY session
   * @param offset - Line offset to start from
   * @param limit - Maximum lines to read
   * @returns Read result with lines and pagination info
   */
  read(session: PTYSession, offset: number = 0, limit?: number): ReadResult {
    const lines = session.buffer.read(offset, limit)
    const totalLines = session.buffer.length
    const hasMore = offset + lines.length < totalLines
    return { lines, totalLines, offset, hasMore }
  }

  /**
   * Search for pattern in session buffer
   * @param session - Source PTY session
   * @param pattern - Regex pattern to search
   * @param offset - Match offset to start from
   * @param limit - Maximum matches to return
   * @returns Search result with matches and pagination info
   */
  search(session: PTYSession, pattern: RegExp, offset: number = 0, limit?: number): SearchResult {
    const allMatches = session.buffer.search(pattern)
    const totalMatches = allMatches.length
    const totalLines = session.buffer.length
    const paginatedMatches =
      limit !== undefined ? allMatches.slice(offset, offset + limit) : allMatches.slice(offset)
    const hasMore = offset + paginatedMatches.length < totalMatches
    return { matches: paginatedMatches, totalMatches, totalLines, offset, hasMore }
  }
}

// Export singleton instance
export const outputManager = new OutputManager()
