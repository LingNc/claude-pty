import type { IPty } from 'bun-pty'

/**
 * PTY Session status
 */
export type PTYStatus = 'running' | 'exited' | 'killing' | 'killed'

/**
 * Search match result
 */
export interface SearchMatch {
  lineNumber: number
  text: string
}

/**
 * Internal PTY Session representation
 */
export interface PTYSession {
  id: string
  title: string
  description?: string
  command: string
  args: string[]
  workdir: string
  env?: Record<string, string>
  status: PTYStatus
  exitCode?: number
  exitSignal?: number | string
  pid: number
  createdAt: Date
  parentSessionId: string
  parentAgent?: string
  notifyOnExit: boolean
  buffer: RingBuffer
  process: IPty | null
}

/**
 * PTY Session info (serializable)
 */
export interface PTYSessionInfo {
  id: string
  title: string
  description?: string
  command: string
  args: string[]
  workdir: string
  status: PTYStatus
  notifyOnExit: boolean
  exitCode?: number
  exitSignal?: number | string
  pid: number
  createdAt: string
  lineCount: number
}

/**
 * Options for spawning a new PTY session
 */
export interface SpawnOptions {
  command: string
  args?: string[]
  workdir?: string
  env?: Record<string, string>
  title?: string
  description?: string
  parentSessionId: string
  parentAgent?: string
  notifyOnExit?: boolean
}

/**
 * Result of reading from buffer
 */
export interface ReadResult {
  lines: string[]
  totalLines: number
  offset: number
  hasMore: boolean
}

/**
 * Result of searching in buffer
 */
export interface SearchResult {
  matches: SearchMatch[]
  totalMatches: number
  totalLines: number
  offset: number
  hasMore: boolean
}

/**
 * Ring Buffer interface for output storage
 */
export interface RingBuffer {
  /** Append data to buffer */
  append(data: string): void
  /** Read lines from buffer */
  read(offset?: number, limit?: number): string[]
  /** Get raw buffer content */
  readRaw(): string
  /** Search for pattern in buffer */
  search(pattern: RegExp): SearchMatch[]
  /** Get line count */
  get length(): number
  /** Get byte length */
  get byteLength(): number
  /** Flush buffer */
  flush(): void
  /** Clear buffer */
  clear(): void
}
