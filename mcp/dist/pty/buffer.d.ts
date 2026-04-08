import type { RingBuffer as IRingBuffer, SearchMatch } from './types.js';
/**
 * Ring buffer implementation for terminal output storage.
 * Automatically truncates old data when max size is exceeded.
 */
export declare class RingBuffer implements IRingBuffer {
    private buffer;
    private maxSize;
    constructor(maxSize?: number);
    /**
     * Append data to the buffer
     */
    append(data: string): void;
    /**
     * Split buffer into lines
     */
    private splitBufferLines;
    /**
     * Read lines from buffer with optional offset and limit
     */
    read(offset?: number, limit?: number): string[];
    /**
     * Get raw buffer content
     */
    readRaw(): string;
    /**
     * Search for pattern in buffer
     */
    search(pattern: RegExp): SearchMatch[];
    /**
     * Get number of lines in buffer
     */
    get length(): number;
    /**
     * Get byte length of buffer
     */
    get byteLength(): number;
    /**
     * Flush any remaining incomplete line
     * (No-op in current implementation)
     */
    flush(): void;
    /**
     * Clear all buffer content
     */
    clear(): void;
}
//# sourceMappingURL=buffer.d.ts.map