import { describe, it, expect, beforeEach, afterEach } from 'bun:test'
import { z } from 'zod'
import {
  ptySpawnSchema,
  ptySpawnDescription,
  executePTYSpawn,
  type PTYSpawnArgs,
} from '../src/tools/spawn.js'
import {
  ptyReadSchema,
  ptyReadDescription,
  executePTYRead,
  type PTYReadArgs,
} from '../src/tools/read.js'
import {
  ptyWriteSchema,
  ptyWriteDescription,
  executePTYWrite,
  type PTYWriteArgs,
} from '../src/tools/write.js'
import {
  ptyKillSchema,
  ptyKillDescription,
  executePTYKill,
  type PTYKillArgs,
} from '../src/tools/kill.js'
import {
  ptyListSchema,
  ptyListDescription,
  executePTYList,
  type PTYListArgs,
} from '../src/tools/list.js'
import { manager } from '../src/shared/manager.js'
import { lifecycleManager } from '../src/pty/session-lifecycle.js'

describe('PTY Tool Schemas', () => {
  describe('pty_spawn schema', () => {
    it('should validate correct spawn arguments', () => {
      const validArgs = {
        command: 'echo',
        args: ['hello', 'world'],
        description: 'Test echo command',
      }
      const result = ptySpawnSchema.safeParse(validArgs)
      expect(result.success).toBe(true)
    })

    it('should require command field', () => {
      const invalidArgs = {
        description: 'Test command',
      }
      const result = ptySpawnSchema.safeParse(invalidArgs)
      expect(result.success).toBe(false)
    })

    it('should require description field', () => {
      const invalidArgs = {
        command: 'echo',
      }
      const result = ptySpawnSchema.safeParse(invalidArgs)
      expect(result.success).toBe(false)
    })

    it('should validate optional args as array of strings', () => {
      const argsWithInvalidType = {
        command: 'echo',
        args: [123, 456],
        description: 'Test',
      }
      const result = ptySpawnSchema.safeParse(argsWithInvalidType)
      expect(result.success).toBe(false)
    })

    it('should accept notifyOnExit boolean', () => {
      const args = {
        command: 'sleep',
        args: ['1'],
        description: 'Test sleep',
        notifyOnExit: true,
      }
      const result = ptySpawnSchema.safeParse(args)
      expect(result.success).toBe(true)
    })

    it('should have description', () => {
      expect(ptySpawnDescription).toContain('PTY')
      expect(ptySpawnDescription.length).toBeGreaterThan(100)
    })
  })

  describe('pty_read schema', () => {
    it('should validate correct read arguments', () => {
      const validArgs = {
        id: 'pty_12345678',
        offset: 0,
        limit: 100,
      }
      const result = ptyReadSchema.safeParse(validArgs)
      expect(result.success).toBe(true)
    })

    it('should require id field', () => {
      const invalidArgs = {
        offset: 0,
      }
      const result = ptyReadSchema.safeParse(invalidArgs)
      expect(result.success).toBe(false)
    })

    it('should accept optional pattern', () => {
      const argsWithPattern = {
        id: 'pty_12345678',
        pattern: 'error|ERROR',
        ignoreCase: true,
      }
      const result = ptyReadSchema.safeParse(argsWithPattern)
      expect(result.success).toBe(true)
    })

    it('should have description', () => {
      expect(ptyReadDescription).toContain('buffer')
      expect(ptyReadDescription.length).toBeGreaterThan(100)
    })
  })

  describe('pty_write schema', () => {
    it('should validate correct write arguments', () => {
      const validArgs = {
        id: 'pty_12345678',
        data: 'hello\n',
      }
      const result = ptyWriteSchema.safeParse(validArgs)
      expect(result.success).toBe(true)
    })

    it('should require id and data fields', () => {
      const invalidArgs = {
        id: 'pty_12345678',
      }
      const result = ptyWriteSchema.safeParse(invalidArgs)
      expect(result.success).toBe(false)
    })

    it('should accept escape sequences in data', () => {
      const argsWithEscape = {
        id: 'pty_12345678',
        data: '\x03\x04\n\r\t',
      }
      const result = ptyWriteSchema.safeParse(argsWithEscape)
      expect(result.success).toBe(true)
    })

    it('should have description', () => {
      expect(ptyWriteDescription).toContain('Write')
      expect(ptyWriteDescription.length).toBeGreaterThan(100)
    })
  })

  describe('pty_kill schema', () => {
    it('should validate correct kill arguments', () => {
      const validArgs = {
        id: 'pty_12345678',
        cleanup: true,
      }
      const result = ptyKillSchema.safeParse(validArgs)
      expect(result.success).toBe(true)
    })

    it('should require id field', () => {
      const invalidArgs = {
        cleanup: false,
      }
      const result = ptyKillSchema.safeParse(invalidArgs)
      expect(result.success).toBe(false)
    })

    it('should have default cleanup as false', () => {
      const args = { id: 'pty_12345678' }
      const result = ptyKillSchema.safeParse(args)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.cleanup).toBe(false)
      }
    })

    it('should have description', () => {
      expect(ptyKillDescription).toContain('kill')
      expect(ptyKillDescription.length).toBeGreaterThan(50)
    })
  })

  describe('pty_list schema', () => {
    it('should accept empty object', () => {
      const validArgs = {}
      const result = ptyListSchema.safeParse(validArgs)
      expect(result.success).toBe(true)
    })

    it('should accept no arguments (empty object)', () => {
      const result = ptyListSchema.safeParse({})
      expect(result.success).toBe(true)
    })

    it('should have description', () => {
      expect(ptyListDescription).toContain('List')
      expect(ptyListDescription.length).toBeGreaterThan(50)
    })
  })
})

describe('PTY Tool Execution', () => {
  afterEach(() => {
    // Clean up all sessions after each test
    lifecycleManager.clearAllSessions()
  })

  describe('executePTYSpawn', () => {
    it('should spawn a simple command', async () => {
      const args: PTYSpawnArgs = {
        command: 'echo',
        args: ['hello', 'world'],
        description: 'Test echo',
      }
      const result = await executePTYSpawn(args)
      expect(result).toContain('pty_spawned')
      expect(result).toContain('echo')
      expect(result).toContain('hello world')
    })

    it('should include session ID in output', async () => {
      const args: PTYSpawnArgs = {
        command: 'echo',
        description: 'Test',
      }
      const result = await executePTYSpawn(args)
      expect(result).toMatch(/ID: pty_[a-f0-9]{8}/)
    })

    it('should handle notifyOnExit option', async () => {
      const args: PTYSpawnArgs = {
        command: 'echo',
        description: 'Test',
        notifyOnExit: true,
      }
      const result = await executePTYSpawn(args)
      expect(result).toContain('pty_exited')
    })
  })

  describe('executePTYList', () => {
    it('should return empty list when no sessions', async () => {
      const result = await executePTYList()
      expect(result).toContain('No active PTY sessions')
    })

    it('should list spawned sessions', async () => {
      // Spawn a session first
      await executePTYSpawn({
        command: 'sleep',
        args: ['10'],
        description: 'Test session',
      })

      const result = await executePTYList()
      expect(result).toContain('pty_list')
      expect(result).toContain('sleep')
    })
  })

  describe('executePTYRead', () => {
    it('should throw error for non-existent session', async () => {
      const args: PTYReadArgs = {
        id: 'pty_nonexistent',
      }
      await expect(executePTYRead(args)).rejects.toThrow("Session 'pty_nonexistent' not found")
    })
  })

  describe('executePTYWrite', () => {
    it('should throw error for non-existent session', async () => {
      const args: PTYWriteArgs = {
        id: 'pty_nonexistent',
        data: 'test',
      }
      await expect(executePTYWrite(args)).rejects.toThrow("Session 'pty_nonexistent' not found")
    })
  })

  describe('executePTYKill', () => {
    it('should throw error for non-existent session', async () => {
      const args: PTYKillArgs = {
        id: 'pty_nonexistent',
      }
      await expect(executePTYKill(args)).rejects.toThrow("Session 'pty_nonexistent' not found")
    })
  })
})
