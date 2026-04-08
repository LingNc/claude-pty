import { describe, it, expect, beforeEach, afterEach } from 'bun:test'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { registerTools } from '../src/tools/index.js'
import { executePTYSpawn, type PTYSpawnArgs } from '../src/tools/spawn.js'
import { executePTYRead, type PTYReadArgs } from '../src/tools/read.js'
import { executePTYWrite, type PTYWriteArgs } from '../src/tools/write.js'
import { executePTYKill, type PTYKillArgs } from '../src/tools/kill.js'
import { executePTYList } from '../src/tools/list.js'
import { lifecycleManager } from '../src/pty/session-lifecycle.js'

describe('PTY Integration Tests', () => {
  beforeEach(() => {
    // Clean up before each test
    lifecycleManager.clearAllSessions()
  })

  afterEach(() => {
    // Clean up after each test
    lifecycleManager.clearAllSessions()
  })

  describe('spawn → read → kill workflow', () => {
    it('should execute complete workflow with echo command', async () => {
      // 1. Spawn
      const spawnArgs: PTYSpawnArgs = {
        command: 'echo',
        args: ['Hello', 'World'],
        description: 'Integration test echo',
      }
      const spawnResult = await executePTYSpawn(spawnArgs)
      expect(spawnResult).toContain('pty_spawned')

      // Extract session ID from spawn result
      const idMatch = spawnResult.match(/ID: (pty_[a-f0-9]{8})/)
      expect(idMatch).toBeTruthy()
      const sessionId = idMatch![1]

      // 2. Read output (may need to wait a bit for process to complete)
      await new Promise(resolve => setTimeout(resolve, 100))

      const readArgs: PTYReadArgs = { id: sessionId }
      const readResult = await executePTYRead(readArgs)
      expect(readResult).toContain('Hello World')
      expect(readResult).toContain('pty_output')

      // 3. Kill/Cleanup
      const killArgs: PTYKillArgs = { id: sessionId, cleanup: true }
      const killResult = await executePTYKill(killArgs)
      expect(killResult).toContain('Cleaned up')

      // Verify session is gone
      const listResult = await executePTYList()
      expect(listResult).toContain('No active PTY sessions')
    })

    it('should handle interactive write workflow', async () => {
      // 1. Spawn cat (interactive)
      const spawnArgs: PTYSpawnArgs = {
        command: 'cat',
        description: 'Interactive cat test',
      }
      const spawnResult = await executePTYSpawn(spawnArgs)
      const idMatch = spawnResult.match(/ID: (pty_[a-f0-9]{8})/)
      const sessionId = idMatch![1]

      // 2. Write input
      const writeArgs: PTYWriteArgs = {
        id: sessionId,
        data: 'Hello from test\n',
      }
      const writeResult = await executePTYWrite(writeArgs)
      expect(writeResult).toContain('Sent')

      // 3. Read echo back
      await new Promise(resolve => setTimeout(resolve, 100))
      const readArgs: PTYReadArgs = { id: sessionId }
      const readResult = await executePTYRead(readArgs)
      expect(readResult).toContain('Hello from test')

      // 4. Send Ctrl+C and cleanup
      const ctrlCArgs: PTYWriteArgs = {
        id: sessionId,
        data: '\x03',
      }
      await executePTYWrite(ctrlCArgs)
      await new Promise(resolve => setTimeout(resolve, 100))

      await executePTYKill({ id: sessionId, cleanup: true })
    })

    it('should handle command with exit code', async () => {
      // Spawn a command that exits with code 1
      const spawnArgs: PTYSpawnArgs = {
        command: 'sh',
        args: ['-c', 'exit 1'],
        description: 'Exit code test',
      }
      const spawnResult = await executePTYSpawn(spawnArgs)
      const idMatch = spawnResult.match(/ID: (pty_[a-f0-9]{8})/)
      const sessionId = idMatch![1]

      // Wait for exit
      await new Promise(resolve => setTimeout(resolve, 200))

      // Read and check status
      const readArgs: PTYReadArgs = { id: sessionId }
      const readResult = await executePTYRead(readArgs)
      expect(readResult).toContain('exited')

      // Cleanup
      await executePTYKill({ id: sessionId, cleanup: true })
    })
  })

  describe('Multi-session concurrency', () => {
    it('should handle multiple concurrent sessions', async () => {
      // Spawn multiple sessions
      const sessionIds: string[] = []

      for (let i = 0; i < 3; i++) {
        const spawnArgs: PTYSpawnArgs = {
          command: 'sleep',
          args: ['10'],
          description: `Concurrent session ${i}`,
        }
        const result = await executePTYSpawn(spawnArgs)
        const idMatch = result.match(/ID: (pty_[a-f0-9]{8})/)
        sessionIds.push(idMatch![1])
      }

      // List all sessions
      const listResult = await executePTYList()
      expect(listResult).toContain('Total: 3 session(s)')

      // Kill all sessions
      for (const id of sessionIds) {
        await executePTYKill({ id, cleanup: true })
      }

      // Verify all cleaned up
      const finalList = await executePTYList()
      expect(finalList).toContain('No active PTY sessions')
    })

    it('should isolate sessions from each other', async () => {
      // Session 1: echo command
      const spawn1 = await executePTYSpawn({
        command: 'echo',
        args: ['session1'],
        description: 'Session 1',
      })
      const id1 = spawn1.match(/ID: (pty_[a-f0-9]{8})/)![1]

      // Session 2: different echo
      const spawn2 = await executePTYSpawn({
        command: 'echo',
        args: ['session2'],
        description: 'Session 2',
      })
      const id2 = spawn2.match(/ID: (pty_[a-f0-9]{8})/)![1]

      // Wait and read
      await new Promise(resolve => setTimeout(resolve, 100))

      const read1 = await executePTYRead({ id: id1 })
      const read2 = await executePTYRead({ id: id2 })

      // Verify isolation
      expect(read1).toContain('session1')
      expect(read1).not.toContain('session2')
      expect(read2).toContain('session2')
      expect(read2).not.toContain('session1')

      // Cleanup
      await executePTYKill({ id: id1, cleanup: true })
      await executePTYKill({ id: id2, cleanup: true })
    })
  })

  describe('Error handling scenarios', () => {
    it('should handle read from non-existent session', async () => {
      await expect(
        executePTYRead({ id: 'pty_nonexistent' })
      ).rejects.toThrow("Session 'pty_nonexistent' not found")
    })

    it('should handle write to non-existent session', async () => {
      await expect(
        executePTYWrite({ id: 'pty_nonexistent', data: 'test' })
      ).rejects.toThrow("Session 'pty_nonexistent' not found")
    })

    it('should handle kill of non-existent session', async () => {
      await expect(
        executePTYKill({ id: 'pty_nonexistent' })
      ).rejects.toThrow("Session 'pty_nonexistent' not found")
    })

    it('should handle write to exited session', async () => {
      // Spawn and wait for exit
      const spawnResult = await executePTYSpawn({
        command: 'echo',
        args: ['done'],
        description: 'Quick exit',
      })
      const id = spawnResult.match(/ID: (pty_[a-f0-9]{8})/)![1]

      // Wait for exit
      await new Promise(resolve => setTimeout(resolve, 100))

      // Try to write to exited session
      await expect(
        executePTYWrite({ id, data: 'test' })
      ).rejects.toThrow(/status is/)

      // Cleanup
      await executePTYKill({ id, cleanup: true })
    })

    it('should handle invalid regex pattern', async () => {
      // Spawn a session
      const spawnResult = await executePTYSpawn({
        command: 'echo',
        args: ['test'],
        description: 'Pattern test',
      })
      const id = spawnResult.match(/ID: (pty_[a-f0-9]{8})/)![1]

      await new Promise(resolve => setTimeout(resolve, 100))

      // Try read with invalid pattern
      await expect(
        executePTYRead({ id, pattern: '[invalid' })
      ).rejects.toThrow(/Invalid regex|Potentially dangerous regex/)

      // Cleanup
      await executePTYKill({ id, cleanup: true })
    })
  })

  describe('Large output handling', () => {
    it('should handle large output with pagination', async () => {
      // Generate large output (1000 lines)
      const spawnArgs: PTYSpawnArgs = {
        command: 'seq',
        args: ['1', '1000'],
        description: 'Large output test',
      }
      const spawnResult = await executePTYSpawn(spawnArgs)
      const id = spawnResult.match(/ID: (pty_[a-f0-9]{8})/)![1]

      // Wait for completion
      await new Promise(resolve => setTimeout(resolve, 500))

      // Read first page
      const read1 = await executePTYRead({ id, offset: 0, limit: 100 })
      expect(read1).toContain('00001| 1')
      expect(read1).toContain('00100| 100')
      expect(read1).toContain('Buffer has more lines')

      // Read second page
      const read2 = await executePTYRead({ id, offset: 100, limit: 100 })
      expect(read2).toContain('00101| 101')
      expect(read2).toContain('00200| 200')

      // Cleanup
      await executePTYKill({ id, cleanup: true })
    })

    it('should handle long lines with truncation', async () => {
      // Generate a very long line
      const spawnArgs: PTYSpawnArgs = {
        command: 'python3',
        args: ['-c', 'print("A" * 5000)'],
        description: 'Long line test',
      }
      const spawnResult = await executePTYSpawn(spawnArgs)
      const id = spawnResult.match(/ID: (pty_[a-f0-9]{8})/)![1]

      await new Promise(resolve => setTimeout(resolve, 200))

      const readResult = await executePTYRead({ id })
      expect(readResult).toContain('...') // Truncated indicator

      // Cleanup
      await executePTYKill({ id, cleanup: true })
    })
  })

  describe('Pattern search integration', () => {
    it('should search for patterns in output', async () => {
      // Generate output with patterns
      const spawnArgs: PTYSpawnArgs = {
        command: 'sh',
        args: ['-c', 'echo "error: something"; echo "info: normal"; echo "error: another"'],
        description: 'Pattern search test',
      }
      const spawnResult = await executePTYSpawn(spawnArgs)
      const id = spawnResult.match(/ID: (pty_[a-f0-9]{8})/)![1]

      await new Promise(resolve => setTimeout(resolve, 100))

      // Search for error pattern
      const readResult = await executePTYRead({ id, pattern: 'error' })
      expect(readResult).toContain('error: something')
      expect(readResult).toContain('error: another')
      expect(readResult).not.toContain('info: normal')

      // Cleanup
      await executePTYKill({ id, cleanup: true })
    })

    it('should handle case-insensitive search', async () => {
      const spawnArgs: PTYSpawnArgs = {
        command: 'sh',
        args: ['-c', 'echo "ERROR"; echo "error"; echo "Error"'],
        description: 'Case insensitive test',
      }
      const spawnResult = await executePTYSpawn(spawnArgs)
      const id = spawnResult.match(/ID: (pty_[a-f0-9]{8})/)![1]

      await new Promise(resolve => setTimeout(resolve, 100))

      const readResult = await executePTYRead({ id, pattern: 'ERROR', ignoreCase: true })
      expect(readResult).toContain('ERROR')
      expect(readResult).toContain('error')
      expect(readResult).toContain('Error')

      // Cleanup
      await executePTYKill({ id, cleanup: true })
    })
  })
})
