import type { RingBuffer as IRingBuffer, SearchMatch } from './types.js'

// Default buffer size in characters (approximately 1MB)
const DEFAULT_MAX_BUFFER_SIZE = parseInt(process.env.PTY_MAX_BUFFER_SIZE || '1000000', 10)

/**
 * Ring buffer implementation for terminal output storage.
 * Automatically truncates old data when max size is exceeded.
 */
export class RingBuffer implements IRingBuffer {
  private buffer: string = ''
  private maxSize: number

  constructor(maxSize: number = DEFAULT_MAX_BUFFER_SIZE) {
    this.maxSize = maxSize
  }

  /**
   * Append data to the buffer
   */
  append(data: string): void {
    this.buffer += data
    if (this.buffer.length > this.maxSize) {
      this.buffer = this.buffer.slice(-this.maxSize)
    }
  }

  /**
   * Split buffer into lines
   */
  private splitBufferLines(): string[] {
    const lines: string[] = this.buffer.split('\n')
    // Remove empty string at end if buffer doesn't end with newline
    if (lines.length && lines[lines.length - 1] === '') {
      lines.pop()
    }
    return lines
  }

  /**
   * Read lines from buffer with optional offset and limit
   */
  read(offset: number = 0, limit?: number): string[] {
    if (this.buffer === '') return []
    const lines: string[] = this.splitBufferLines()
    const start = Math.max(0, offset)
    const end = limit !== undefined ? start + limit : lines.length
    return lines.slice(start, end)
  }

  /**
   * Get raw buffer content
   */
  readRaw(): string {
    return this.buffer
  }

  /**
   * Search for pattern in buffer
   */
  search(pattern: RegExp): SearchMatch[] {
    const matches: SearchMatch[] = []
    const lines: string[] = this.splitBufferLines()

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      if (line && pattern.test(line)) {
        matches.push({ lineNumber: i + 1, text: line })
      }
    }
    return matches
  }

  /**
   * Get number of lines in buffer
   */
  get length(): number {
    if (this.buffer === '') return 0
    const lines = this.splitBufferLines()
    return lines.length
  }

  /**
   * Get byte length of buffer
   */
  get byteLength(): number {
    return this.buffer.length
  }

  /**
   * Flush any remaining incomplete line
   * (No-op in current implementation)
   */
  flush(): void {
    // No-op in new implementation
  }

  /**
   * Clear all buffer content
   */
  clear(): void {
    this.buffer = ''
  }
}
