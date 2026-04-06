import { defineTool } from 'claude-code/plugin'
import { manager } from '../pty/manager.js'
import { checkCommandPermission, checkWorkdirPermission } from '../permissions.js'
import type { PTYSessionInfo } from '../pty/types.js'

const NOTIFY_ON_EXIT_INSTRUCTIONS = [
  `<system_reminder>`,
  `Completion signal for this session is the future \`<pty_exited>\` message.`,
  `If you only need to know whether the command finished, do not call \`pty_read\`; wait for \`<pty_exited>\`.`,
  `Never use sleep plus \`pty_read\` loops to check completion for this session.`,
  `Call \`pty_read\` before exit only if you need live output now, the user explicitly asks for logs, or the exit notification reports a non-zero status and you need to investigate.`,
  `</system_reminder>`,
].join('\n')

/**
 * Format spawn output with XML tags
 */
function formatSpawnOutput(info: PTYSessionInfo): string {
  const output = [
    `<pty_spawned>`,
    `ID: ${info.id}`,
    `Title: ${info.title}`,
    `Command: ${info.command} ${info.args.join(' ')}`,
    `Workdir: ${info.workdir}`,
    `PID: ${info.pid}`,
    `Status: ${info.status}`,
    `NotifyOnExit: ${info.notifyOnExit}`,
    `</pty_spawned>`,
    ...(info.notifyOnExit ? ['', NOTIFY_ON_EXIT_INSTRUCTIONS] : []),
  ]
  return output.join('\n')
}

export const ptySpawnTool = defineTool({
  name: 'pty_spawn',
  description: `Spawns a new interactive PTY (pseudo-terminal) session that runs in the background.

Unlike the built-in bash tool which runs commands synchronously and waits for completion, PTY sessions persist and allow you to:
- Run long-running processes (dev servers, watch modes, etc.)
- Send interactive input (including Ctrl+C, arrow keys, etc.)
- Read output at any time
- Manage multiple concurrent terminal sessions

Usage:
- The \`command\` parameter is required (e.g., "npm", "python", "bash")
- Use \`args\` to pass arguments to the command (e.g., ["run", "dev"])
- Use \`workdir\` to set the working directory (defaults to project root)
- Use \`env\` to set additional environment variables
- Use \`title\` to give the session a human-readable name
- The \`description\` parameter is required: a clear, concise 5-10 word description
- Use \`notifyOnExit\` to receive a notification when the process exits (default: false)

Returns the session info including:
- \`id\`: Unique identifier (pty_XXXXXXXX) for use with other pty_* tools
- \`pid\`: Process ID
- \`status\`: Current status ("running")

After spawning, use:
- \`pty_write\` to send input to the PTY
- \`pty_read\` to read output from the PTY
- \`pty_list\` to see all active PTY sessions
- \`pty_kill\` to terminate the PTY

Exit Notifications:
When \`notifyOnExit\` is true, you will receive a message when the process exits containing:
- Session ID and title
- Exit code
- Total output lines
- Last line of output (truncated to 250 chars)

This is useful for long-running processes where you want to be notified when they complete
instead of polling with \`pty_read\`.
- Completion signal is the future \`<pty_exited>\` message
- If you only need to know whether the command finished, do not call \`pty_read\`; wait for \`<pty_exited>\`
- Never use sleep plus \`pty_read\` loops to check completion
- Use \`pty_read\` before exit only if you need live output now, the user explicitly asks for logs, or the exit notification reports a non-zero status and you need to investigate`,
  parameters: {
    command: {
      type: 'string',
      description: 'The command/executable to run',
    },
    args: {
      type: 'array',
      items: { type: 'string' },
      description: 'Arguments to pass to the command',
    },
    workdir: {
      type: 'string',
      description: 'Working directory for the PTY session',
    },
    env: {
      type: 'object',
      description: 'Additional environment variables',
    },
    title: {
      type: 'string',
      description: 'Human-readable title for the session',
    },
    description: {
      type: 'string',
      description: 'Clear, concise description of what this PTY session is for in 5-10 words',
    },
    notifyOnExit: {
      type: 'boolean',
      description: 'If true, sends a notification to the session when the process exits (default: false)',
    },
  },
  async execute(args, context) {
    // Check command permission
    await checkCommandPermission(args.command, args.args || [])

    // Check workdir permission if provided
    if (args.workdir) {
      await checkWorkdirPermission(args.workdir)
    }

    // Set notify function if available (for exit notifications)
    if (context.notify) {
      manager.setNotifyFn(context.notify)
    }

    const session = manager.spawn({
      command: args.command,
      args: args.args || [],
      workdir: args.workdir,
      env: args.env as Record<string, string>,
      title: args.title,
      description: args.description,
      parentSessionId: context.sessionId || 'default',
      parentAgent: context.agent,
      notifyOnExit: args.notifyOnExit ?? false,
    })

    return formatSpawnOutput(session)
  },
})
