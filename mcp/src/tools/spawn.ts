import { z } from 'zod';
import type { PTYSessionInfo } from '../pty/types.js';

// 动态导入manager避免启动时初始化
let manager: typeof import('../pty/manager.js').manager | null = null;

function getManager() {
  if (!manager) {
    manager = require('../pty/manager.js').manager;
  }
  return manager;
}

const NOTIFY_ON_EXIT_INSTRUCTIONS = [
  `<system_reminder>`,
  `Completion signal for this session is the future \`<pty_exited>\` message.`,
  `If you only need to know whether the command finished, do not call \`pty_read\`; wait for \`<pty_exited>\`.`,
  `Never use sleep plus \`pty_read\` loops to check completion for this session.`,
  `Call \`pty_read\` before exit only if you need live output now, the user explicitly asks for logs, or the exit notification reports a non-zero status and you need to investigate.`,
  `</system_reminder>`,
].join('\n');

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
  ];
  return output.join('\n');
}

/**
 * pty_spawn tool parameters schema
 */
export const ptySpawnSchema = z.object({
  command: z.string().describe('The command/executable to run'),
  args: z.array(z.string()).optional().describe('Arguments to pass to the command'),
  workdir: z.string().optional().describe('Working directory for the PTY session'),
  env: z.record(z.string()).optional().describe('Additional environment variables'),
  title: z.string().optional().describe('Human-readable title for the session'),
  description: z.string().describe('Clear, concise description of what this PTY session is for in 5-10 words'),
  notifyOnExit: z.boolean().optional().default(false).describe('If true, logs exit info to stderr when the process exits (default: false)'),
});

export type PTYSpawnArgs = z.infer<typeof ptySpawnSchema>;

/**
 * pty_spawn tool description
 */
export const ptySpawnDescription = `Spawns a new interactive PTY (pseudo-terminal) session that runs in the background.

Unlike synchronous command execution, PTY sessions persist and allow you to:
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
- Use \`notifyOnExit\` to receive a log message when the process exits (default: false)

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
When \`notifyOnExit\` is true, you will receive a log message when the process exits containing:
- Session ID and title
- Exit code
- Total output lines
- Last line of output (truncated to 250 chars)

This is useful for long-running processes where you want to be notified when they complete
instead of polling with \`pty_read\`.
- Completion signal is the future \`<pty_exited>\` log message
- If you only need to know whether the command finished, do not call \`pty_read\`; wait for \`<pty_exited>\`
- Never use sleep plus \`pty_read\` loops to check completion
- Use \`pty_read\` before exit only if you need live output now, the user explicitly asks for logs, or the exit notification reports a non-zero status and you need to investigate`;

/**
 * Execute pty_spawn tool
 */
export async function executePTYSpawn(args: PTYSpawnArgs): Promise<string> {
  const mgr = getManager();

  // In MCP, we don't have context.sessionId or context.agent
  // Use default values for MCP environment
  const session = mgr.spawn({
    command: args.command,
    args: args.args || [],
    workdir: args.workdir,
    env: args.env,
    title: args.title,
    description: args.description,
    parentSessionId: 'mcp-session',
    parentAgent: 'mcp-server',
    notifyOnExit: args.notifyOnExit ?? false,
  });

  // In MCP, we don't have context.notify
  // Exit notifications will be logged to stderr via console.error
  // This is set up in the server initialization

  return formatSpawnOutput(session);
}
