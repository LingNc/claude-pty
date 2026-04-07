import { describe, it, expect, beforeEach, afterEach } from 'bun:test'
import { manager } from '../src/pty/manager.js'
import { PTYServer } from '../src/web/server/server.js'

describe('PTY Integration Tests', () => {
  describe('Tool Chain Flow', () => {
    it('should complete spawn → write → read → kill flow', async () => {
      // 1. Spawn a session
      const session = manager.spawn({
        command: 'echo',
        args: ['hello', 'world'],
        parentSessionId: 'test',
        description: 'Test echo session',
      })

      expect(session).toBeDefined()
      expect(session.id).toMatch(/^pty_/)
      expect(session.command).toBe('echo')
      expect(session.status).toBe('running')

      // 2. Read output (echo should complete quickly)
      await new Promise((resolve) => setTimeout(resolve, 500))

      const readResult = manager.read(session.id)
      expect(readResult).toBeDefined()
      expect(readResult?.lines.length).toBeGreaterThan(0)

      // 3. Kill the session
      const killed = manager.kill(session.id, true)
      expect(killed).toBe(true)

      // 4. Verify session is gone
      const afterKill = manager.get(session.id)
      expect(afterKill).toBeNull()
    })

    it('should handle multiple sessions', () => {
      const session1 = manager.spawn({
        command: 'echo',
        args: ['session1'],
        parentSessionId: 'test',
      })

      const session2 = manager.spawn({
        command: 'echo',
        args: ['session2'],
        parentSessionId: 'test',
      })

      // List should contain both
      const sessions = manager.list()
      expect(sessions.length).toBeGreaterThanOrEqual(2)

      // Cleanup
      manager.kill(session1.id, true)
      manager.kill(session2.id, true)
    })

    it('should handle session write and read', async () => {
      // Note: This test requires a real PTY that accepts input
      // For now, we test the API surface
      const session = manager.spawn({
        command: 'cat',
        parentSessionId: 'test',
      })

      // Write to session
      const writeResult = manager.write(session.id, 'test input\n')
      expect(writeResult).toBe(true)

      // Read output
      await new Promise((resolve) => setTimeout(resolve, 100))
      const readResult = manager.read(session.id)
      expect(readResult).toBeDefined()

      // Cleanup
      manager.kill(session.id, true)
    })
  })

  describe('Web Server', () => {
    let server: PTYServer | null = null

    afterEach(() => {
      if (server) {
        server[Symbol.dispose]()
        server = null
      }
    })

    it('should start PTYServer', async () => {
      server = await PTYServer.createServer()
      expect(server).toBeDefined()

      const url = server.getHttpUrl()
      expect(url).toMatch(/^http:\/\//)

      const wsUrl = server.getWsUrl()
      expect(wsUrl).toMatch(/^ws:\/\//)
    })

    it('should provide health endpoint', async () => {
      server = await PTYServer.createServer()
      const url = server.getHttpUrl()

      const response = await fetch(`${url}/health`)
      expect(response.ok).toBe(true)

      const health = await response.json()
      expect(health.status).toBe('healthy')
      expect(health.sessions).toBeDefined()
      expect(health.sessions.total).toBeGreaterThanOrEqual(0)
    })

    it('should list sessions via API', async () => {
      // Create a session first
      const session = manager.spawn({
        command: 'echo',
        args: ['test'],
        parentSessionId: 'test',
      })

      server = await PTYServer.createServer()
      const url = server.getHttpUrl()

      const response = await fetch(`${url}/api/sessions`)
      expect(response.ok).toBe(true)

      const sessions = await response.json()
      expect(Array.isArray(sessions)).toBe(true)

      // Cleanup
      manager.kill(session.id, true)
    })
  })

  describe('Cleanup', () => {
    it('should cleanup sessions by parent session ID', () => {
      const parentId = 'test-parent'

      const session1 = manager.spawn({
        command: 'echo',
        args: ['1'],
        parentSessionId: parentId,
      })

      const session2 = manager.spawn({
        command: 'echo',
        args: ['2'],
        parentSessionId: parentId,
      })

      const otherSession = manager.spawn({
        command: 'echo',
        args: ['other'],
        parentSessionId: 'other-parent',
      })

      // Cleanup by parent
      manager.cleanupBySession(parentId)

      // Sessions with matching parent should be gone
      expect(manager.get(session1.id)).toBeNull()
      expect(manager.get(session2.id)).toBeNull()

      // Other session should remain
      expect(manager.get(otherSession.id)).toBeDefined()

      // Cleanup
      manager.kill(otherSession.id, true)
    })

    it('should clear all sessions', () => {
      // Create some sessions
      manager.spawn({ command: 'echo', args: ['1'], parentSessionId: 'test' })
      manager.spawn({ command: 'echo', args: ['2'], parentSessionId: 'test' })

      // Clear all
      manager.clearAllSessions()

      // All should be gone
      expect(manager.list().length).toBe(0)
    })
  })
})
