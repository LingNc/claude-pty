import { definePlugin, defineTool, defineSetting } from 'claude-code/plugin'
import { SessionLifecycleManager } from './pty/session-lifecycle.js'
import { OutputManager } from './pty/output-manager.js'
import type { PTYSession, SpawnOptions } from './pty/types.js'

// Plugin state
const lifecycleManager = new SessionLifecycleManager()
const outputManager = new OutputManager()

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

  tools: [
    // pty_spawn - Create a new PTY session
    defineTool({
      name: 'pty_spawn',
      description: 'Spawn a new PTY terminal session',
      parameters: {
        command: { type: 'string', description: 'Command to execute' },
        args: { type: 'array', items: { type: 'string' }, description: 'Command arguments' },
        workdir: { type: 'string', description: 'Working directory' },
        env: { type: 'object', description: 'Environment variables' },
        title: { type: 'string', description: 'Session title' },
        description: { type: 'string', description: 'Session description' },
      },
      async execute(params) {
        const session = lifecycleManager.spawn(
          {
            command: params.command,
            args: params.args || [],
            workdir: params.workdir,
            env: params.env,
            title: params.title,
            description: params.description,
            parentSessionId: 'default',
          },
          (s, data) => {
            // Data callback - handled by internal manager
          },
          (s, exitCode) => {
            // Exit callback - handled by internal manager
          }
        )
        return { success: true, session }
      },
    }),

    // pty_write - Write to a PTY session
    defineTool({
      name: 'pty_write',
      description: 'Write data to a PTY session',
      parameters: {
        sessionId: { type: 'string', description: 'Session ID' },
        data: { type: 'string', description: 'Data to write' },
      },
      async execute(params) {
        const session = lifecycleManager.getSession(params.sessionId)
        if (!session) {
          return { success: false, error: `Session ${params.sessionId} not found` }
        }
        const result = outputManager.write(session, params.data)
        return { success: result }
      },
    }),

    // pty_read - Read from a PTY session buffer
    defineTool({
      name: 'pty_read',
      description: 'Read output from a PTY session buffer',
      parameters: {
        sessionId: { type: 'string', description: 'Session ID' },
        offset: { type: 'number', description: 'Line offset' },
        limit: { type: 'number', description: 'Max lines to read' },
      },
      async execute(params) {
        const session = lifecycleManager.getSession(params.sessionId)
        if (!session) {
          return { success: false, error: `Session ${params.sessionId} not found` }
        }
        const result = outputManager.read(session, params.offset, params.limit)
        return { success: true, ...result }
      },
    }),

    // pty_search - Search in PTY session buffer
    defineTool({
      name: 'pty_search',
      description: 'Search for patterns in PTY session output',
      parameters: {
        sessionId: { type: 'string', description: 'Session ID' },
        pattern: { type: 'string', description: 'Regex pattern to search' },
        offset: { type: 'number', description: 'Match offset' },
        limit: { type: 'number', description: 'Max matches to return' },
      },
      async execute(params) {
        const session = lifecycleManager.getSession(params.sessionId)
        if (!session) {
          return { success: false, error: `Session ${params.sessionId} not found` }
        }
        const regex = new RegExp(params.pattern)
        const result = outputManager.search(session, regex, params.offset, params.limit)
        return { success: true, ...result }
      },
    }),

    // pty_kill - Kill a PTY session
    defineTool({
      name: 'pty_kill',
      description: 'Kill a PTY session',
      parameters: {
        sessionId: { type: 'string', description: 'Session ID' },
        cleanup: { type: 'boolean', description: 'Clean up session data' },
      },
      async execute(params) {
        const result = lifecycleManager.kill(params.sessionId, params.cleanup ?? true)
        return { success: result }
      },
    }),

    // pty_list - List all PTY sessions
    defineTool({
      name: 'pty_list',
      description: 'List all active PTY sessions',
      parameters: {},
      async execute() {
        const sessions = lifecycleManager.listSessions().map(s => lifecycleManager.toInfo(s))
        return { success: true, sessions }
      },
    }),
  ],
})
