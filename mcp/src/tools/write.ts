import { z } from 'zod';
import { manager } from '../shared/manager.js';
import { lifecycleManager } from '../pty/session-lifecycle.js';

// Escape sequence characters
const ETX = String.fromCharCode(3);   // Ctrl+C
const EOT = String.fromCharCode(4);   // Ctrl+D

/**
 * Parse escape sequences in a string to their actual byte values
 * Handles: \n, \r, \t, \xNN (hex), \\, etc.
 *
 * @param input - The input string with escape sequences
 * @returns The parsed string with actual byte values
 */
function parseEscapeSequences(input: string): string {
  return input
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t')
    .replace(/\\x([0-9A-Fa-f]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/\\\\/g, '\\');
}

/**
 * Format preview for display (truncate and escape special chars)
 */
function formatPreview(data: string): string {
  const truncated = data.length > 50 ? `${data.slice(0, 50)}...` : data;
  return truncated
    .replace(/\x03/g, '^C')
    .replace(/\x04/g, '^D')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r');
}

/**
 * pty_write tool parameters schema
 */
export const ptyWriteSchema = z.object({
  id: z.string().describe('The PTY session ID'),
  data: z.string().describe('The input to send'),
});

export type PTYWriteArgs = z.infer<typeof ptyWriteSchema>;

/**
 * pty_write tool description
 */
export const ptyWriteDescription = `Write data to an active PTY session. Use this tool to:
- Type commands or text into an interactive terminal
- Send special key sequences (Ctrl+C, Enter, arrow keys, etc.)
- Respond to prompts in interactive programs

Usage:
- id: The PTY session ID (from pty_spawn or pty_list)
- data: The input to send (text, commands, or escape sequences)

Common escape sequences:
- Enter/newline: \\n or \\r
- Ctrl+C (interrupt): \\x03
- Ctrl+D (EOF): \\x04
- Tab: \\t
- Arrow Up: \\x1b[A
- Arrow Down: \\x1b[B
- Arrow Right: \\x1b[C
- Arrow Left: \\x1b[D

Returns success or error message.

Examples:
- Send a command: data="ls -la\\n"
- Interrupt a process: data="\\x03"
- Answer a prompt: data="yes\\n"`;

/**
 * Execute pty_write tool
 */
export async function executePTYWrite(args: PTYWriteArgs): Promise<string> {
  const session = lifecycleManager.getSession(args.id);
  if (!session) {
    throw new Error(`Session '${args.id}' not found`);
  }

  if (session.status !== 'running') {
    throw new Error(`Cannot write to session '${args.id}' - status is '${session.status}'`);
  }

  const parsedData = parseEscapeSequences(args.data);

  // In MCP, we don't have checkCommandPermission
  // Permissions are handled by the MCP client

  const success = manager.write(args.id, parsedData);

  if (!success) {
    throw new Error(`Failed to write to session '${args.id}'`);
  }

  const preview = formatPreview(args.data);
  return `Sent ${args.data.length} bytes to ${args.id}: "${preview}"`;
}
