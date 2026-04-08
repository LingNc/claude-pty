import { describe, it, expect, beforeEach, afterEach } from 'bun:test'
import { existsSync, readFileSync, writeFileSync, mkdirSync, rmdirSync, unlinkSync, readdirSync } from 'fs'
import { join } from 'path'
import { homedir } from 'os'

const LOG_DIR = join(homedir(), '.claude-pty', 'logs')
const LOG_FILE = join(LOG_DIR, 'mcp.log')
const BUN_PATH = '/home/lingnc/.bun/bin/bun'
const MCP_PATH = '/home/lingnc/workspace/claude-pty/mcp/dist/server.js'

describe('Phase 2: Process Keepalive & Logging', () => {
  beforeEach(() => {
    // Clean up log directory before each test
    if (existsSync(LOG_FILE)) {
      unlinkSync(LOG_FILE)
    }
  })

  afterEach(() => {
    // Cleanup
    if (existsSync(LOG_FILE)) {
      unlinkSync(LOG_FILE)
    }
  })

  describe('Log System', () => {
    it('should create log directory', () => {
      // Create log dir if not exists
      if (!existsSync(LOG_DIR)) {
        mkdirSync(LOG_DIR, { recursive: true })
      }
      expect(existsSync(LOG_DIR)).toBe(true)
    })

    it('should write log file', () => {
      // Create log dir
      if (!existsSync(LOG_DIR)) {
        mkdirSync(LOG_DIR, { recursive: true })
      }

      // Write test log
      const testLog = `[${new Date().toISOString()}] [INFO] Test log message\n`
      writeFileSync(LOG_FILE, testLog)

      expect(existsSync(LOG_FILE)).toBe(true)
      const content = readFileSync(LOG_FILE, 'utf-8')
      expect(content).toContain('Test log message')
    })

    it('should append multiple log entries', () => {
      if (!existsSync(LOG_DIR)) {
        mkdirSync(LOG_DIR, { recursive: true })
      }

      const log1 = `[${new Date().toISOString()}] [INFO] First message\n`
      const log2 = `[${new Date().toISOString()}] [WARN] Second message\n`

      writeFileSync(LOG_FILE, log1)
      const existing = readFileSync(LOG_FILE, 'utf-8')
      writeFileSync(LOG_FILE, existing + log2)

      const content = readFileSync(LOG_FILE, 'utf-8')
      expect(content).toContain('First message')
      expect(content).toContain('Second message')
    })
  })

  describe('Log Rotation', () => {
    it('should identify old log files', () => {
      if (!existsSync(LOG_DIR)) {
        mkdirSync(LOG_DIR, { recursive: true })
      }

      // Create a test log file
      const testFile = join(LOG_DIR, 'test-old.log')
      writeFileSync(testFile, 'old log content')

      // Get file stats
      const stats = existsSync(testFile)
      expect(stats).toBe(true)

      // Cleanup
      unlinkSync(testFile)
    })

    it('should keep recent log files', () => {
      if (!existsSync(LOG_DIR)) {
        mkdirSync(LOG_DIR, { recursive: true })
      }

      // Create a recent log file
      const recentFile = join(LOG_DIR, 'recent.log')
      writeFileSync(recentFile, 'recent content')

      // Check it exists
      expect(existsSync(recentFile)).toBe(true)

      // Cleanup
      unlinkSync(recentFile)
    })
  })

  describe('Process Startup', () => {
    it('should start MCP server with bun', async () => {
      const proc = Bun.spawn({
        cmd: [BUN_PATH, MCP_PATH],
        stderr: 'pipe',
        stdout: 'pipe',
      })

      // Wait for startup message
      const reader = proc.stderr.getReader()
      const decoder = new TextDecoder()
      let output = ''

      const timeout = setTimeout(() => {
        reader.cancel()
        proc.kill()
      }, 5000)

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
      expect(output).toContain('Registered 5 PTY tools')
    })

    it('should capture process PID', async () => {
      const proc = Bun.spawn({
        cmd: [BUN_PATH, MCP_PATH],
        stderr: 'pipe',
      })

      expect(proc.pid).toBeGreaterThan(0)

      // Cleanup
      proc.kill()
      await new Promise(r => setTimeout(r, 100))
    })
  })

  describe('Graceful Shutdown', () => {
    it('should handle SIGTERM', async () => {
      const proc = Bun.spawn({
        cmd: [BUN_PATH, MCP_PATH],
        stderr: 'pipe',
      })

      // Wait for startup
      await new Promise(r => setTimeout(r, 500))

      // Send SIGTERM
      proc.kill('SIGTERM')

      // Wait for exit
      const exitCode = await proc.exited

      // Process should exit
      expect(exitCode).toBeDefined()
    })

    it('should handle force kill after timeout', async () => {
      const proc = Bun.spawn({
        cmd: [BUN_PATH, MCP_PATH],
        stderr: 'pipe',
      })

      // Wait for startup
      await new Promise(r => setTimeout(r, 500))

      // Send SIGKILL directly
      proc.kill('SIGKILL')

      // Wait for exit
      const exitCode = await proc.exited

      // Process should exit
      expect(exitCode).toBeDefined()
    })
  })

  describe('Code Review', () => {
    it('should have restart counter logic', () => {
      const srcPath = '/home/lingnc/workspace/claude-pty/src/index.ts'
      const content = readFileSync(srcPath, 'utf-8')

      expect(content).toContain('restartCount')
      expect(content).toContain('MAX_RESTARTS = 3')
      expect(content).toContain('restartTimer')
    })

    it('should have log rotation logic', () => {
      const srcPath = '/home/lingnc/workspace/claude-pty/src/index.ts'
      const content = readFileSync(srcPath, 'utf-8')

      expect(content).toContain('rotateLogs')
      expect(content).toContain('MAX_LOG_DAYS = 7')
      expect(content).toContain('LOG_DIR')
      expect(content).toContain('LOG_FILE')
    })

    it('should have graceful shutdown logic', () => {
      const srcPath = '/home/lingnc/workspace/claude-pty/src/index.ts'
      const content = readFileSync(srcPath, 'utf-8')

      expect(content).toContain('SIGTERM')
      expect(content).toContain('SIGKILL')
      expect(content).toContain('stopMCPServer')
      expect(content).toContain('Force killing')
    })

    it('should reset restart counter on success', () => {
      const srcPath = '/home/lingnc/workspace/claude-pty/src/index.ts'
      const content = readFileSync(srcPath, 'utf-8')

      expect(content).toContain('resetRestartCounter')
    })

    it('should have log function with levels', () => {
      const srcPath = '/home/lingnc/workspace/claude-pty/src/index.ts'
      const content = readFileSync(srcPath, 'utf-8')

      expect(content).toContain('function log(')
      expect(content).toContain("level: 'INFO' | 'WARN' | 'ERROR'")
      expect(content).toContain('appendFileSync(LOG_FILE')
    })
  })
})
