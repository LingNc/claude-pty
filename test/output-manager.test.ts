import { OutputManager } from '../src/pty/output-manager.js'
import { RingBuffer } from '../src/pty/buffer.js'
import type { PTYSession } from '../src/pty/types.js'

// Mock PTYSession for testing
function createMockSession(overrides: Partial<PTYSession> = {}): PTYSession {
  return {
    id: 'test_session',
    title: 'Test Session',
    command: 'test',
    args: [],
    workdir: '/tmp',
    status: 'running',
    pid: 12345,
    createdAt: new Date(),
    parentSessionId: 'default',
    notifyOnExit: false,
    buffer: new RingBuffer(),
    process: null,
    ...overrides,
  }
}

describe('OutputManager', () => {
  describe('write', () => {
    it('should return true on successful write', () => {
      const manager = new OutputManager()
      const session = createMockSession()

      // Writing to session without process should still return true (for compatibility)
      const result = manager.write(session, 'test data')
      expect(result).toBe(true)
    })

    it('should write data to session process', () => {
      const manager = new OutputManager()
      let writtenData: string | null = null

      const mockProcess = {
        write: (data: string) => {
          writtenData = data
        },
      }

      const session = createMockSession({
        process: mockProcess as unknown as PTYSession['process'],
      })

      manager.write(session, 'hello world')
      expect(writtenData).toBe('hello world')
    })

    it('should handle write errors gracefully', () => {
      const manager = new OutputManager()
      const mockProcess = {
        write: () => {
          throw new Error('Write failed')
        },
      }

      const session = createMockSession({
        process: mockProcess as unknown as PTYSession['process'],
      })

      // Should return true even on error (for compatibility)
      const result = manager.write(session, 'test')
      expect(result).toBe(true)
    })
  })

  describe('read', () => {
    it('should read lines from session buffer', () => {
      const manager = new OutputManager()
      const buffer = new RingBuffer()
      buffer.append('line1\nline2\nline3')

      const session = createMockSession({ buffer })
      const result = manager.read(session)

      expect(result.lines).toEqual(['line1', 'line2', 'line3'])
      expect(result.totalLines).toBe(3)
      expect(result.offset).toBe(0)
      expect(result.hasMore).toBe(false)
    })

    it('should handle offset parameter', () => {
      const manager = new OutputManager()
      const buffer = new RingBuffer()
      buffer.append('line1\nline2\nline3')

      const session = createMockSession({ buffer })
      const result = manager.read(session, 1)

      expect(result.lines).toEqual(['line2', 'line3'])
      expect(result.offset).toBe(1)
    })

    it('should handle limit parameter', () => {
      const manager = new OutputManager()
      const buffer = new RingBuffer()
      buffer.append('line1\nline2\nline3')

      const session = createMockSession({ buffer })
      const result = manager.read(session, 0, 2)

      expect(result.lines).toEqual(['line1', 'line2'])
      expect(result.hasMore).toBe(true)
    })

    it('should return correct hasMore flag', () => {
      const manager = new OutputManager()
      const buffer = new RingBuffer()
      buffer.append('line1\nline2\nline3\nline4')

      const session = createMockSession({ buffer })
      const result = manager.read(session, 0, 2)

      expect(result.hasMore).toBe(true)

      const result2 = manager.read(session, 2, 2)
      expect(result2.hasMore).toBe(false)
    })

    it('should handle empty buffer', () => {
      const manager = new OutputManager()
      const session = createMockSession()

      const result = manager.read(session)

      expect(result.lines).toEqual([])
      expect(result.totalLines).toBe(0)
      expect(result.hasMore).toBe(false)
    })
  })

  describe('search', () => {
    it('should find matching lines', () => {
      const manager = new OutputManager()
      const buffer = new RingBuffer()
      buffer.append('error: something\ninfo: message\nerror: another')

      const session = createMockSession({ buffer })
      const result = manager.search(session, /error/)

      expect(result.matches.length).toBe(2)
      expect(result.totalMatches).toBe(2)
    })

    it('should handle offset and limit for matches', () => {
      const manager = new OutputManager()
      const buffer = new RingBuffer()
      buffer.append('error: 1\nerror: 2\nerror: 3\nerror: 4')

      const session = createMockSession({ buffer })
      const result = manager.search(session, /error/, 1, 2)

      expect(result.matches.length).toBe(2)
      expect(result.matches[0].text).toBe('error: 2')
      expect(result.matches[1].text).toBe('error: 3')
      expect(result.offset).toBe(1)
      expect(result.hasMore).toBe(true)
    })

    it('should return correct totalLines', () => {
      const manager = new OutputManager()
      const buffer = new RingBuffer()
      buffer.append('line1\nline2\nline3')

      const session = createMockSession({ buffer })
      const result = manager.search(session, /line/)

      expect(result.totalLines).toBe(3)
    })

    it('should handle no matches', () => {
      const manager = new OutputManager()
      const buffer = new RingBuffer()
      buffer.append('line1\nline2')

      const session = createMockSession({ buffer })
      const result = manager.search(session, /nomatch/)

      expect(result.matches).toEqual([])
      expect(result.totalMatches).toBe(0)
      expect(result.hasMore).toBe(false)
    })

    it('should handle empty buffer', () => {
      const manager = new OutputManager()
      const session = createMockSession()

      const result = manager.search(session, /pattern/)

      expect(result.matches).toEqual([])
      expect(result.totalLines).toBe(0)
    })
  })
})
