import { z } from 'zod';
import { manager } from '../shared/manager.js';
import { lifecycleManager } from '../pty/session-lifecycle.js';
import type { PTYSessionInfo } from '../pty/types.js';

const DEFAULT_READ_LIMIT = 500;
const MAX_LINE_LENGTH = 2000;

const NOTIFY_ON_EXIT_REMINDER = [
  `<system_reminder>`,
  `This session was started with notifyOnExit=true.`,
  `Completion signal is the future <pty_exited> message, not repeated pty_read calls.`,
  `If you only need to know whether the command finished, stop polling and wait for <pty_exited>.`,
  `Do not use sleep plus pty_read loops to check completion.`,
  `Use pty_read only when you need live output now, the user explicitly asks for logs, or the exit notification reports a non-zero status and you need to investigate.`,
  `</system_reminder>`,
].join('\n');

/**
 * Format a single line with line number and truncation
 */
function formatLine(line: string, lineNum: number, maxLength: number = MAX_LINE_LENGTH): string {
  const lineNumStr = lineNum.toString().padStart(5, '0');
  const truncatedLine = line.length > maxLength ? `${line.slice(0, maxLength)}...` : line;
  return `${lineNumStr}| ${truncatedLine}`;
}

/**
 * Append notify on exit reminder if applicable
 */
function appendNotifyOnExitReminder(output: string, session: PTYSessionInfo): string {
  if (!session.notifyOnExit || session.status !== 'running') {
    return output;
  }
  return `${output}\n\n${NOTIFY_ON_EXIT_REMINDER}`;
}

/**
 * Validate regex pattern for safety
 */
function validateRegex(pattern: string): boolean {
  try {
    new RegExp(pattern);
    // Check for potentially dangerous patterns
    const dangerousPatterns = [
      /\(\?:.*\)\*.*\(\?:.*\)\*/, // nested optional groups with repetition
      /.*\(\..*\?\)\{2,\}.*/, // overlapping non-greedy quantifiers
      /.*\(.*\|.*\)\{3,\}.*/, // complex alternation with repetition
    ];
    return !dangerousPatterns.some((dangerous) => dangerous.test(pattern));
  } catch {
    return false;
  }
}

/**
 * Handle plain reading (no pattern)
 */
function handlePlainRead(
  session: PTYSessionInfo,
  offset: number,
  limit: number
): string {
  const ptySession = lifecycleManager.getSession(session.id);
  if (!ptySession) {
    throw new Error(`Session '${session.id}' not found`);
  }

  const result = manager.read(session.id, offset, limit);
  if (!result) {
    throw new Error(`Failed to read from session '${session.id}'`);
  }

  if (result.lines.length === 0) {
    return appendNotifyOnExitReminder(
      [
        `<pty_output id="${session.id}" status="${session.status}">`,
        `(No output available - buffer is empty)`,
        `Total lines: ${result.totalLines}`,
        `</pty_output>`,
      ].join('\n'),
      session
    );
  }

  const formattedLines = result.lines.map((line, index) =>
    formatLine(line, result.offset + index + 1)
  );

  const paginationMessage = `(Buffer has more lines. Use offset=${result.offset + result.lines.length} to read beyond line ${result.offset + result.lines.length})`;
  const endMessage = `(End of buffer - total ${result.totalLines} lines)`;

  const output = [
    `<pty_output id="${session.id}" status="${session.status}">`,
    ...formattedLines,
    '',
    result.hasMore ? paginationMessage : endMessage,
    `</pty_output>`,
  ].join('\n');

  return appendNotifyOnExitReminder(output, session);
}

/**
 * Handle pattern-based reading
 */
function handlePatternRead(
  session: PTYSessionInfo,
  pattern: string,
  ignoreCase: boolean,
  offset: number,
  limit: number
): string {
  if (!validateRegex(pattern)) {
    throw new Error(`Potentially dangerous regex pattern rejected: '${pattern}'. Please use a safer pattern.`);
  }

  let regex: RegExp;
  try {
    regex = new RegExp(pattern, ignoreCase ? 'i' : '');
  } catch (e) {
    const error = e instanceof Error ? e.message : String(e);
    throw new Error(`Invalid regex pattern '${pattern}': ${error}`);
  }

  const ptySession = lifecycleManager.getSession(session.id);
  if (!ptySession) {
    throw new Error(`Session '${session.id}' not found`);
  }

  const result = manager.search(session.id, regex, offset, limit);
  if (!result) {
    throw new Error(`Failed to search session '${session.id}'`);
  }

  if (result.matches.length === 0) {
    return appendNotifyOnExitReminder(
      [
        `<pty_output id="${session.id}" status="${session.status}" pattern="${pattern}">`,
        `No lines matched the pattern '${pattern}'.`,
        `Total lines in buffer: ${result.totalLines}`,
        `</pty_output>`,
      ].join('\n'),
      session
    );
  }

  const formattedLines = result.matches.map((match) =>
    formatLine(match.text, match.lineNumber)
  );

  const paginationMessage = `(${result.matches.length} of ${result.totalMatches} matches shown. Use offset=${offset + result.matches.length} to see more.)`;
  const endMessage = `(${result.totalMatches} match${result.totalMatches === 1 ? '' : 'es'} from ${result.totalLines} total lines)`;

  const output = [
    `<pty_output id="${session.id}" status="${session.status}" pattern="${pattern}">`,
    ...formattedLines,
    '',
    result.hasMore ? paginationMessage : endMessage,
    `</pty_output>`,
  ].join('\n');

  return appendNotifyOnExitReminder(output, session);
}

/**
 * pty_read tool parameters schema
 */
export const ptyReadSchema = z.object({
  id: z.string().describe('The PTY session ID'),
  offset: z.number().optional().describe('Line number to start reading from (0-based, defaults to 0)'),
  limit: z.number().optional().describe('Number of lines to read (defaults to 500)'),
  pattern: z.string().optional().describe('Regex pattern to filter lines (optional)'),
  ignoreCase: z.boolean().optional().describe('Case-insensitive pattern matching (default: false)'),
});

export type PTYReadArgs = z.infer<typeof ptyReadSchema>;

/**
 * pty_read tool description
 */
export const ptyReadDescription = `Reads output from a PTY session's buffer.

The PTY maintains a rolling buffer of output lines. Use offset and limit to paginate through the output, similar to reading a file.

Usage:
- id: The PTY session ID (from pty_spawn or pty_list)
- offset: Line number to start reading from (0-based, defaults to 0)
- limit: Number of lines to read (defaults to 500)
- pattern: Regex pattern to filter lines (optional)
- ignoreCase: Case-insensitive pattern matching (default: false)

Returns:
- Numbered lines of output (similar to cat -n format)
- Total line count in the buffer
- Indicator if more lines are available

Pattern Filtering:
- When pattern is set, lines are FILTERED FIRST using the regex, then offset/limit apply to the MATCHES
- Original line numbers are preserved so you can see where matches occurred in the buffer
- Supports full regex syntax (e.g., "error", "ERROR|WARN", "failed.*connection", etc.)

Tips:
- To see the latest output, use a high offset or omit offset to read from the start
- To tail recent output, calculate offset as (totalLines - N) where N is how many recent lines you want
- Lines longer than 2000 characters are truncated
- If the session was started with notifyOnExit=true, do not use repeated pty_read calls only to detect completion`;

/**
 * Execute pty_read tool
 */
export async function executePTYRead(args: PTYReadArgs): Promise<string> {
  const session = lifecycleManager.getSession(args.id);
  if (!session) {
    throw new Error(`Session '${args.id}' not found`);
  }

  const offset = args.offset ?? 0;
  const limit = args.limit ?? DEFAULT_READ_LIMIT;

  const sessionInfo = lifecycleManager.toInfo(session);

  if (args.pattern) {
    return handlePatternRead(sessionInfo, args.pattern, args.ignoreCase ?? false, offset, limit);
  } else {
    return handlePlainRead(sessionInfo, offset, limit);
  }
}
