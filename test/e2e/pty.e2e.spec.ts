import { test, expect } from '@playwright/test'
import { PTYServer } from '../../src/web/server/server.js'
import { manager } from '../../src/pty/manager.js'

let server: PTYServer | null = null
let serverUrl: string = ''

test.beforeAll(async () => {
  server = await PTYServer.createServer()
  serverUrl = server.getHttpUrl()
})

test.afterAll(() => {
  if (server) {
    server[Symbol.dispose]()
    server = null
  }
  manager.clearAllSessions()
})

test.describe('PTY Web E2E Tests', () => {
  test('should open web interface', async ({ page }) => {
    await page.goto(serverUrl)
    await expect(page).toHaveTitle(/PTY/i)
  })

  test('should display sidebar with session list', async ({ page }) => {
    await page.goto(serverUrl)
    await expect(page.locator('.sidebar')).toBeVisible()
    await expect(page.locator('.sidebar-header h1')).toContainText('PTY Sessions')
  })

  test('should show connection status', async ({ page }) => {
    await page.goto(serverUrl)
    await expect(page.locator('.connection-status')).toBeVisible()
    await expect(page.locator('.connection-status.connected')).toBeVisible()
  })

  test('should create session via API and display in UI', async ({ page }) => {
    // Create a session first
    const session = manager.spawn({
      command: 'echo',
      args: ['hello', 'world'],
      parentSessionId: 'e2e-test',
      description: 'E2E Test Session',
    })

    await page.goto(serverUrl)

    // Wait for session to appear in sidebar
    await expect(page.locator('.session-item')).toBeVisible()
    await expect(page.locator('.session-title')).toContainText('E2E Test Session')

    // Cleanup
    manager.kill(session.id, true)
  })

  test('should click session and show terminal', async ({ page }) => {
    // Create a session
    const session = manager.spawn({
      command: 'echo',
      args: ['test output'],
      parentSessionId: 'e2e-test',
      description: 'Click Test Session',
    })

    await page.goto(serverUrl)

    // Wait and click on session
    await page.locator('.session-item').first().click()

    // Verify terminal container is visible
    await expect(page.locator('.output-container')).toBeVisible()

    // Cleanup
    manager.kill(session.id, true)
  })

  test('should show empty state when no sessions', async ({ page }) => {
    // Clear all sessions
    manager.clearAllSessions()

    await page.goto(serverUrl)

    await expect(page.locator('.empty-state')).toBeVisible()
    await expect(page.locator('.empty-state')).toContainText('Select a session')
  })

  test('should display session info correctly', async ({ page }) => {
    const session = manager.spawn({
      command: 'echo',
      args: ['test'],
      parentSessionId: 'e2e-test',
      description: 'Info Test',
    })

    await page.goto(serverUrl)

    // Check session info is displayed
    await expect(page.locator('.session-info')).toContainText('echo')
    await expect(page.locator('.status-badge')).toBeVisible()

    // Cleanup
    manager.kill(session.id, true)
  })
})
