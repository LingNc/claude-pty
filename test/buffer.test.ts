import { RingBuffer } from '../src/pty/buffer.js'

describe('RingBuffer', () => {
  describe('append', () => {
    it('should append data to buffer', () => {
      const buffer = new RingBuffer(1000)
      buffer.append('hello world')
      expect(buffer.readRaw()).toBe('hello world')
    })

    it('should truncate old data when exceeding max size', () => {
      const buffer = new RingBuffer(10)
      buffer.append('hello world!!') // 13 chars, exceeds 10
      expect(buffer.readRaw().length).toBeLessThanOrEqual(10)
    })

    it('should keep most recent data when truncating', () => {
      const buffer = new RingBuffer(5)
      buffer.append('hello')
      buffer.append('world')
      expect(buffer.readRaw()).toBe('world')
    })
  })

  describe('read', () => {
    it('should return empty array for empty buffer', () => {
      const buffer = new RingBuffer()
      expect(buffer.read()).toEqual([])
    })

    it('should split buffer into lines', () => {
      const buffer = new RingBuffer()
      buffer.append('line1\nline2\nline3')
      const lines = buffer.read()
      expect(lines).toEqual(['line1', 'line2', 'line3'])
    })

    it('should handle offset parameter', () => {
      const buffer = new RingBuffer()
      buffer.append('line1\nline2\nline3')
      const lines = buffer.read(1)
      expect(lines).toEqual(['line2', 'line3'])
    })

    it('should handle limit parameter', () => {
      const buffer = new RingBuffer()
      buffer.append('line1\nline2\nline3')
      const lines = buffer.read(0, 2)
      expect(lines).toEqual(['line1', 'line2'])
    })

    it('should handle offset and limit together', () => {
      const buffer = new RingBuffer()
      buffer.append('line1\nline2\nline3\nline4')
      const lines = buffer.read(1, 2)
      expect(lines).toEqual(['line2', 'line3'])
    })

    it('should handle buffer not ending with newline', () => {
      const buffer = new RingBuffer()
      buffer.append('line1\nline2')
      const lines = buffer.read()
      expect(lines).toEqual(['line1', 'line2'])
    })

    it('should handle buffer ending with newline', () => {
      const buffer = new RingBuffer()
      buffer.append('line1\nline2\n')
      const lines = buffer.read()
      expect(lines).toEqual(['line1', 'line2'])
    })

    it('should handle offset beyond buffer length', () => {
      const buffer = new RingBuffer()
      buffer.append('line1\nline2')
      const lines = buffer.read(10)
      expect(lines).toEqual([])
    })

    it('should handle negative offset', () => {
      const buffer = new RingBuffer()
      buffer.append('line1\nline2\nline3')
      const lines = buffer.read(-5)
      expect(lines).toEqual(['line1', 'line2', 'line3'])
    })
  })

  describe('search', () => {
    it('should find matching lines', () => {
      const buffer = new RingBuffer()
      buffer.append('error: something went wrong\ninfo: all good\nerror: another error')
      const matches = buffer.search(/error/)
      expect(matches.length).toBe(2)
      expect(matches[0].lineNumber).toBe(1)
      expect(matches[1].lineNumber).toBe(3)
    })

    it('should return empty array for no matches', () => {
      const buffer = new RingBuffer()
      buffer.append('line1\nline2\nline3')
      const matches = buffer.search(/nomatch/)
      expect(matches).toEqual([])
    })

    it('should include line text in matches', () => {
      const buffer = new RingBuffer()
      buffer.append('hello world\ngoodbye world')
      const matches = buffer.search(/world/)
      expect(matches[0].text).toBe('hello world')
      expect(matches[1].text).toBe('goodbye world')
    })

    it('should handle empty buffer', () => {
      const buffer = new RingBuffer()
      const matches = buffer.search(/pattern/)
      expect(matches).toEqual([])
    })

    it('should handle regex with flags', () => {
      const buffer = new RingBuffer()
      buffer.append('ERROR: critical\nerror: minor')
      const matches = buffer.search(/error/i)
      expect(matches.length).toBe(2)
    })
  })

  describe('length', () => {
    it('should return 0 for empty buffer', () => {
      const buffer = new RingBuffer()
      expect(buffer.length).toBe(0)
    })

    it('should return correct line count', () => {
      const buffer = new RingBuffer()
      buffer.append('line1\nline2\nline3')
      expect(buffer.length).toBe(3)
    })

    it('should handle single line', () => {
      const buffer = new RingBuffer()
      buffer.append('single line')
      expect(buffer.length).toBe(1)
    })

    it('should update after append', () => {
      const buffer = new RingBuffer()
      expect(buffer.length).toBe(0)
      buffer.append('line1')
      expect(buffer.length).toBe(1)
      buffer.append('\nline2')
      expect(buffer.length).toBe(2)
    })
  })

  describe('byteLength', () => {
    it('should return 0 for empty buffer', () => {
      const buffer = new RingBuffer()
      expect(buffer.byteLength).toBe(0)
    })

    it('should return correct byte length', () => {
      const buffer = new RingBuffer()
      buffer.append('hello')
      expect(buffer.byteLength).toBe(5)
    })

    it('should include newline characters', () => {
      const buffer = new RingBuffer()
      buffer.append('hello\nworld')
      expect(buffer.byteLength).toBe(11)
    })
  })

  describe('readRaw', () => {
    it('should return empty string for empty buffer', () => {
      const buffer = new RingBuffer()
      expect(buffer.readRaw()).toBe('')
    })

    it('should return raw buffer content', () => {
      const buffer = new RingBuffer()
      buffer.append('hello\nworld')
      expect(buffer.readRaw()).toBe('hello\nworld')
    })
  })

  describe('clear', () => {
    it('should clear all content', () => {
      const buffer = new RingBuffer()
      buffer.append('hello\nworld')
      buffer.clear()
      expect(buffer.readRaw()).toBe('')
      expect(buffer.length).toBe(0)
    })
  })

  describe('flush', () => {
    it('should be callable without error', () => {
      const buffer = new RingBuffer()
      buffer.append('test')
      expect(() => buffer.flush()).not.toThrow()
    })
  })
})
