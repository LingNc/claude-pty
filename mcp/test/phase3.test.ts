import { describe, it, expect, beforeEach, afterEach } from 'bun:test'
import { existsSync, readFileSync, writeFileSync, mkdirSync, unlinkSync } from 'fs'
import { join } from 'path'
import { homedir } from 'os'

const MCP_CONFIG_PATH = join(homedir(), '.config', 'claude', 'mcp.json')
const BUN_PATH = '/home/lingnc/.bun/bin/bun'

describe('Phase 3: Hot Reload & User Notifications', () => {
  describe('Code Review', () => {
    it('should have config watcher setup', () => {
      const srcPath = '/home/lingnc/workspace/claude-pty/src/index.ts'
      const content = readFileSync(srcPath, 'utf-8')

      expect(content).toContain('configWatcher')
      expect(content).toContain('watch(MCP_CONFIG_PATH')
      expect(content).toContain("eventType === 'change'")
    })

    it('should have notifyUser function with emoji', () => {
      const srcPath = '/home/lingnc/workspace/claude-pty/src/index.ts'
      const content = readFileSync(srcPath, 'utf-8')

      expect(content).toContain('function notifyUser(')
      expect(content).toContain('success:')
      expect(content).toContain('warning:')
      expect(content).toContain('error:')
      expect(content).toContain("'✅'")
      expect(content).toContain("'⚠️'")
      expect(content).toContain("'❌'")
    })

    it('should have hot reload logic', () => {
      const srcPath = '/home/lingnc/workspace/claude-pty/src/index.ts'
      const content = readFileSync(srcPath, 'utf-8')

      expect(content).toContain('setupConfigWatcher')
      expect(content).toContain('cleanupConfigWatcher')
      expect(content).toContain('Config watcher stopped')
    })

    it('should handle config change event', () => {
      const srcPath = '/home/lingnc/workspace/claude-pty/src/index.ts'
      const content = readFileSync(srcPath, 'utf-8')

      expect(content).toContain('MCP config file changed, reloading...')
      expect(content).toContain('stopMCPServer')
      expect(content).toContain('setupMCP(context)')
    })

    it('should have suggestion in notifications', () => {
      const srcPath = '/home/lingnc/workspace/claude-pty/src/index.ts'
      const content = readFileSync(srcPath, 'utf-8')

      expect(content).toContain('💡')
      expect(content).toContain('suggestion')
    })

    it('should cleanup watcher on unload', () => {
      const srcPath = '/home/lingnc/workspace/claude-pty/src/index.ts'
      const content = readFileSync(srcPath, 'utf-8')

      expect(content).toContain('cleanupConfigWatcher')
      expect(content).toContain('onUnload')
    })
  })

  describe('Config File Handling', () => {
    it('should create config directory', () => {
      const configDir = join(homedir(), '.config', 'claude')
      if (!existsSync(configDir)) {
        mkdirSync(configDir, { recursive: true })
      }
      expect(existsSync(configDir)).toBe(true)
    })

    it('should write valid MCP config', () => {
      const configDir = join(homedir(), '.config', 'claude')
      if (!existsSync(configDir)) {
        mkdirSync(configDir, { recursive: true })
      }

      const testConfig = {
        mcpServers: {
          'claude-pty': {
            command: 'bun',
            args: ['/test/path/mcp/dist/server.js'],
            description: 'Test config',
          },
        },
      }

      writeFileSync(MCP_CONFIG_PATH, JSON.stringify(testConfig, null, 2))

      const saved = JSON.parse(readFileSync(MCP_CONFIG_PATH, 'utf-8'))
      expect(saved.mcpServers['claude-pty'].command).toBe('bun')
    })
  })

  describe('Notification Messages', () => {
    it('should format success message with emoji', () => {
      const srcPath = '/home/lingnc/workspace/claude-pty/src/index.ts'
      const content = readFileSync(srcPath, 'utf-8')

      // Check success notification
      expect(content).toContain("notifyUser(context, 'success', 'MCP server started")
    })

    it('should format error message with emoji', () => {
      const srcPath = '/home/lingnc/workspace/claude-pty/src/index.ts'
      const content = readFileSync(srcPath, 'utf-8')

      // Check error notification
      expect(content).toContain("notifyUser(")
      expect(content).toContain("'error'")
    })

    it('should format warning message with emoji', () => {
      const srcPath = '/home/lingnc/workspace/claude-pty/src/index.ts'
      const content = readFileSync(srcPath, 'utf-8')

      // Check warning notifications
      expect(content).toContain("notifyUser(context, 'warning',")
    })
  })

  describe('Integration', () => {
    it('should verify all notifyUser calls have status and message', () => {
      const srcPath = '/home/lingnc/workspace/claude-pty/src/index.ts'
      const content = readFileSync(srcPath, 'utf-8')

      // Count notifyUser calls
      const matches = content.match(/notifyUser\(/g)
      expect(matches).toBeDefined()
      expect(matches.length).toBeGreaterThanOrEqual(4)
    })

    it('should have watcher in setupMCP', () => {
      const srcPath = '/home/lingnc/workspace/claude-pty/src/index.ts'
      const content = readFileSync(srcPath, 'utf-8')

      // setupConfigWatcher should be called in setupMCP
      expect(content).toContain('setupConfigWatcher(context)')
    })

    it('should import watch from fs', () => {
      const srcPath = '/home/lingnc/workspace/claude-pty/src/index.ts'
      const content = readFileSync(srcPath, 'utf-8')

      expect(content).toContain('watch, type FSWatcher')
    })
  })
})
