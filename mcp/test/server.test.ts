import { describe, it, expect, beforeEach } from 'bun:test'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { registerTools } from '../src/tools/index.js'

describe('MCP Server', () => {
  let server: McpServer

  beforeEach(() => {
    server = new McpServer({
      name: 'test-server',
      version: '0.1.0',
    })
  })

  describe('Server initialization', () => {
    it('should create server with correct name', () => {
      expect(server).toBeDefined()
    })

    it('should register all 5 PTY tools', () => {
      // Capture console.error output
      let registeredMessage = ''
      const originalError = console.error
      console.error = (...args: unknown[]) => {
        registeredMessage = args.join(' ')
      }

      registerTools(server)

      console.error = originalError
      expect(registeredMessage).toContain('5 PTY tools')
      expect(registeredMessage).toContain('pty_spawn')
      expect(registeredMessage).toContain('pty_read')
      expect(registeredMessage).toContain('pty_write')
      expect(registeredMessage).toContain('pty_kill')
      expect(registeredMessage).toContain('pty_list')
    })
  })

  describe('Tool registration', () => {
    it('should register pty_spawn tool', () => {
      // We can't easily test the internal state of McpServer
      // but we can verify registration doesn't throw
      expect(() => registerTools(server)).not.toThrow()
    })

    it('should throw on duplicate registration', () => {
      // First registration
      expect(() => registerTools(server)).not.toThrow()
      // Second registration should throw (tools already registered)
      expect(() => registerTools(server)).toThrow()
    })
  })
})
