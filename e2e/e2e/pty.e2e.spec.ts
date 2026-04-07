import { expect } from '@playwright/test'
import { test as extendedTest } from '../fixtures'
import type { PTYSessionInfo } from '../../src/pty/types'

extendedTest.describe('Server Clean Start', () => {
  extendedTest('should start with empty session list via API', async ({ api }) => {
    // Clear any existing sessions first
    await api.sessions.clear()

    // Wait for sessions to actually be cleared
    let sessions: PTYSessionInfo[] = []
    for (let i = 0; i < 5; i++) {
      sessions = await api.sessions.list()
      if (sessions.length === 0) break
      await new Promise((resolve) => setTimeout(resolve, 100))
    }

    expect(Array.isArray(sessions)).toBe(true)
    expect(sessions.length).toBe(0)
  })

  extendedTest('should start with empty session list via browser', async ({ page, api }) => {
    // Clear any existing sessions from previous tests
    await api.sessions.clear()

    // Wait for sessions to actually be cleared in the UI
    for (let i = 0; i < 5; i++) {
      const sessionItems = page.locator('.session-item')
      try {
        await expect(sessionItems).toHaveCount(0, { timeout: 500 })
        break
      } catch {
        await new Promise((resolve) => setTimeout(resolve, 100))
      }
    }

    // Check that there are no sessions in the sidebar
    const sessionItems = page.locator('.session-item')
    await expect(sessionItems).toHaveCount(0, { timeout: 2000 })

    // Check that the "No active sessions" message appears
    await expect(page.getByText('No active sessions')).toBeVisible()
  })
})

extendedTest.describe('Session Management', () => {
  extendedTest('should create a new session via API', async ({ api }) => {
    await api.sessions.clear()

    const session = await api.sessions.create({
      command: 'bash',
      args: ['-c', 'echo hello'],
    })

    expect(session).toBeDefined()
    expect(session.id).toBeDefined()
    expect(session.status).toBe('running')

    // Clean up using api.session.kill
    await api.session.kill({ id: session.id })
  })

  extendedTest('should list sessions after creation', async ({ api }) => {
    await api.sessions.clear()

    const session = await api.sessions.create({
      command: 'bash',
      args: ['-c', 'sleep 1'],
    })

    const sessions = await api.sessions.list()
    expect(sessions.length).toBe(1)
    expect(sessions[0].id).toBe(session.id)

    // Clean up
    await api.session.kill({ id: session.id })
  })

  extendedTest('should read session output', async ({ api }) => {
    await api.sessions.clear()

    const session = await api.sessions.create({
      command: 'bash',
      args: ['-c', 'echo "test output"'],
    })

    // Wait for process to complete
    await new Promise((resolve) => setTimeout(resolve, 500))

    // Read plain buffer instead of non-existent read method
    const output = await api.session.buffer.plain({ id: session.id })
    expect(output.plain.includes('test output')).toBe(true)

    // Clean up
    await api.session.kill({ id: session.id })
  })

  extendedTest('should kill a session', async ({ api }) => {
    await api.sessions.clear()

    const session = await api.sessions.create({
      command: 'bash',
      args: ['-c', 'sleep 10'],
    })

    await api.session.kill({ id: session.id })

    // Verify session is terminated (status can be 'killed' or 'exited')
    const sessions = await api.sessions.list()
    const found = sessions.find(s => s.id === session.id)
    expect(['killed', 'exited']).toContain(found?.status)
  })
})

extendedTest.describe('Web Interface', () => {
  extendedTest('should load the web interface', async ({ page }) => {
    // Page is automatically navigated by fixture
    await expect(page.locator('body')).toBeVisible()
    // Use more specific selector for sidebar
    await expect(page.locator('div.sidebar')).toBeVisible({ timeout: 5000 })
  })

  extendedTest('should display sidebar header', async ({ page, api }) => {
    await api.sessions.clear()

    // Check sidebar header exists
    await expect(page.locator('.sidebar-header')).toBeVisible()
    await expect(page.getByText('PTY Sessions')).toBeVisible()
  })
})
