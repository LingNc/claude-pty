import { defineTool } from 'claude-code/plugin'
import { manager } from '../pty/manager.js'
import { lifecycleManager } from '../pty/session-lifecycle.js'

export const ptyKill = defineTool({
  name: 'pty_kill',
  description: `Terminates a PTY session and optionally cleans up its buffer.

Use this tool to:
- Stop a running process (sends SIGTERM)
- Clean up an exited session to free memory
- Remove a session from the list

Usage:
- id: The PTY session ID (from pty_spawn or pty_list)
- cleanup: If true, removes the session and frees the buffer (default: false)

Behavior:
- If the session is running, it will be killed (status becomes "killed")
- If cleanup=false (default), the session remains in the list with its output buffer intact
- If cleanup=true, the session is removed entirely and the buffer is freed
- Keeping sessions without cleanup allows you to compare logs between runs

Tips:
- Use cleanup=false if you might want to read the output later
- Use cleanup=true when you're done with the session entirely
- To send Ctrl+C instead of killing, use pty_write with data="\\x03"

Examples:
- Kill but keep logs: cleanup=false (or omit)
- Kill and remove: cleanup=true`,
  parameters: {
    id: {
      type: 'string',
      description: 'The PTY session ID',
    },
    cleanup: {
      type: 'boolean',
      default: false,
      description: 'If true, removes the session and frees the buffer',
    },
  },
  async execute(args) {
    const session = lifecycleManager.getSession(args.id)
    if (!session) {
      throw new Error(`Session '${args.id}' not found`)
    }

    const wasRunning = session.status === 'running'
    const success = manager.kill(args.id, args.cleanup ?? false)

    if (!success) {
      throw new Error(`Failed to kill PTY session '${args.id}'`)
    }
    const action = wasRunning ? 'Killed' : 'Cleaned up'
    const cleanupNote = args.cleanup ? ' (session removed)' : ' (session retained for log access)'
    return `${action}: ${args.id}${cleanupNote}`
  },
})
