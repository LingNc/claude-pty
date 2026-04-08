import { definePlugin, defineSetting } from 'claude-code/plugin'
import { spawn, type ChildProcess } from 'child_process'
import { resolve, join } from 'path'
import { existsSync, writeFileSync, mkdirSync } from 'fs'
import { homedir } from 'os'
import { ptySpawnTool } from './tools/spawn.js'
import { ptyWrite } from './tools/write.js'
import { ptyRead } from './tools/read.js'
import { ptyKill } from './tools/kill.js'
import { ptyList } from './tools/list.js'
import { manager } from './pty/manager.js'
import { ptyOpenCommand, ptyShowUrlCommand } from './commands/pty-open.js'

// MCP Server process reference
let mcpProcess: ChildProcess | null = null

/**
 * Start MCP server as a child process
 */
function startMCPServer(): ChildProcess | null {
  try {
    // Find MCP server path (handle both dev and production)
    const possiblePaths = [
      resolve(__dirname, '../mcp/dist/server.js'),
      resolve(__dirname, '../../mcp/dist/server.js'),
      join(process.cwd(), 'mcp/dist/server.js'),
    ]

    const mcpPath = possiblePaths.find(p => existsSync(p))
    if (!mcpPath) {
      console.error('[MCP] Server not found in:', possiblePaths)
      return null
    }

    console.error('[MCP] Starting server from:', mcpPath)

    const proc = spawn('bun', [mcpPath], {
      stdio: ['pipe', 'pipe', 'pipe'],
      detached: false,
    })

    proc.on('error', (err) => {
      console.error('[MCP] Process error:', err)
    })

    proc.on('exit', (code) => {
      console.error(`[MCP] Process exited with code ${code}`)
      mcpProcess = null
    })

    proc.stderr?.on('data', (data) => {
      const msg = data.toString().trim()
      if (msg) console.error('[MCP]', msg)
    })

    console.error('[MCP] Server started with PID:', proc.pid)
    return proc
  } catch (err) {
    console.error('[MCP] Failed to start:', err)
    return null
  }
}

/**
 * Generate MCP configuration file
 * Fallback when API registration is not available
 */
function generateMCPConfig(): boolean {
  try {
    const possiblePaths = [
      resolve(__dirname, '../mcp/dist/server.js'),
      resolve(__dirname, '../../mcp/dist/server.js'),
      join(process.cwd(), 'mcp/dist/server.js'),
    ]

    const mcpPath = possiblePaths.find(p => existsSync(p))
    if (!mcpPath) {
      console.error('[MCP] Cannot generate config: server not found')
      return false
    }

    // Claude Code MCP config path
    const configDir = join(homedir(), '.config', 'claude')
    const configPath = join(configDir, 'mcp.json')

    // Ensure directory exists
    if (!existsSync(configDir)) {
      mkdirSync(configDir, { recursive: true })
    }

    // Read existing config or create new
    let config: any = {}
    try {
      if (existsSync(configPath)) {
        config = JSON.parse(require('fs').readFileSync(configPath, 'utf-8'))
      }
    } catch {
      config = {}
    }

    // Add/update claude-pty MCP server
    config.mcpServers = config.mcpServers || {}
    config.mcpServers['claude-pty'] = {
      command: 'bun',
      args: [mcpPath],
      description: 'PTY terminal integration for Claude Code',
    }

    writeFileSync(configPath, JSON.stringify(config, null, 2))
    console.error('[MCP] Configuration written to:', configPath)
    return true
  } catch (err) {
    console.error('[MCP] Failed to generate config:', err)
    return false
  }
}

/**
 * Try to register MCP server via API or fallback to config
 */
async function setupMCP(context: any): Promise<boolean> {
  // Try to start MCP server
  mcpProcess = startMCPServer()

  if (!mcpProcess) {
    console.error('[MCP] Failed to start server, trying config fallback...')
    return generateMCPConfig()
  }

  // Try API registration (if Claude Code supports it)
  if (context.registerMCPServer) {
    try {
      await context.registerMCPServer({
        name: 'claude-pty',
        process: mcpProcess,
      })
      console.error('[MCP] Registered via API')
      return true
    } catch (err) {
      console.error('[MCP] API registration failed:', err)
    }
  }

  // Fallback: generate config file
  console.error('[MCP] API not available, using config file...')
  const configOk = generateMCPConfig()

  if (configOk) {
    // Notify user to restart
    if (context.notify) {
      context.notify('MCP server configured. Please restart Claude Code to activate.')
    }
  }

  return configOk
}

export default definePlugin({
  name: 'claude-pty',
  description: 'PTY terminal integration for Claude Code',

  settings: [
    defineSetting({
      key: 'pty.maxBufferSize',
      type: 'number',
      description: 'Maximum buffer size in characters',
      default: 1000000,
    }),
    defineSetting({
      key: 'pty.defaultCols',
      type: 'number',
      description: 'Default terminal columns',
      default: 120,
    }),
    defineSetting({
      key: 'pty.defaultRows',
      type: 'number',
      description: 'Default terminal rows',
      default: 30,
    }),
  ],

  tools: [ptySpawnTool, ptyWrite, ptyRead, ptyKill, ptyList],

  commands: [ptyOpenCommand, ptyShowUrlCommand],

  // Plugin lifecycle hooks
  async onLoad(context) {
    console.error('[Plugin] claude-pty loading...')

    // Setup MCP server
    const mcpOk = await setupMCP(context)
    if (mcpOk) {
      console.error('[Plugin] MCP setup complete')
    } else {
      console.error('[Plugin] MCP setup failed, plugin tools still available')
    }

    console.error('[Plugin] claude-pty loaded successfully')
  },

  onUnload() {
    console.error('[Plugin] claude-pty unloading...')

    // Cleanup MCP server
    if (mcpProcess) {
      console.error('[MCP] Stopping server...')
      mcpProcess.kill()
      mcpProcess = null
    }

    console.error('[Plugin] claude-pty unloaded')
  },

  // Session cleanup hook - clean up child PTY sessions when parent session is deleted
  onSessionDeleted({ sessionId }) {
    manager.cleanupBySession(sessionId)
  },
})
