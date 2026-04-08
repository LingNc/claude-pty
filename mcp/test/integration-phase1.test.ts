import { describe, it, expect } from 'bun:test'
import { existsSync, readFileSync, unlinkSync, mkdirSync, rmdirSync } from 'fs'
import { join } from 'path'
import { homedir } from 'os'

const BUN_PATH = '/home/lingnc/.bun/bin/bun'

describe('MCP Integration Tests', () => {
  describe('MCP Server Startup', () => {
    it('should verify bun is available', () => {
      expect(existsSync(BUN_PATH)).toBe(true)
    })

    it('should verify MCP server dist exists', () => {
      const distPath = '/home/lingnc/workspace/claude-pty/mcp/dist/server.js'
      expect(existsSync(distPath)).toBe(true)
    })

    it('should verify MCP server can start', async () => {
      const proc = Bun.spawn({
        cmd: [BUN_PATH, '/home/lingnc/workspace/claude-pty/mcp/dist/server.js'],
        stderr: 'pipe',
      })

      // Wait for startup message
      const reader = proc.stderr.getReader()
      const decoder = new TextDecoder()
      let output = ''

      const timeout = setTimeout(() => {
        reader.cancel()
        proc.kill()
      }, 3000)

      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          output += decoder.decode(value)
          if (output.includes('MCP PTY Server')) break
        }
      } finally {
        clearTimeout(timeout)
        reader.cancel()
        proc.kill()
      }

      expect(output).toContain('MCP PTY Server')
      expect(output).toContain('pty_spawn')
      expect(output).toContain('pty_read')
    })
  })

  describe('Plugin Configuration', () => {
    it('should verify src/index.ts uses bun', () => {
      const srcPath = '/home/lingnc/workspace/claude-pty/src/index.ts'
      const content = readFileSync(srcPath, 'utf-8')
      expect(content).toContain("spawn('bun'")
      expect(content).toContain("command: 'bun'")
      expect(content).toContain("import { homedir } from 'os'")
    })

    it('should verify package.json exports', () => {
      const pkgPath = '/home/lingnc/workspace/claude-pty/package.json'
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'))
      expect(pkg.exports).toBeDefined()
      expect(pkg.exports['./mcp']).toBe('./mcp/dist/server.js')
      expect(pkg.bin['claude-pty-mcp']).toBe('./mcp/dist/server.js')
    })
  })

  describe('Tool Registration', () => {
    it('should verify all 5 tools are registered', async () => {
      const proc = Bun.spawn({
        cmd: [BUN_PATH, '/home/lingnc/workspace/claude-pty/mcp/dist/server.js'],
        stderr: 'pipe',
      })

      const reader = proc.stderr.getReader()
      const decoder = new TextDecoder()
      let output = ''

      const timeout = setTimeout(() => {
        reader.cancel()
        proc.kill()
      }, 3000)

      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          output += decoder.decode(value)
          if (output.includes('5 PTY tools')) break
        }
      } finally {
        clearTimeout(timeout)
        reader.cancel()
        proc.kill()
      }

      expect(output).toContain('pty_spawn')
      expect(output).toContain('pty_read')
      expect(output).toContain('pty_write')
      expect(output).toContain('pty_kill')
      expect(output).toContain('pty_list')
    })
  })
})
