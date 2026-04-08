import { z } from 'zod';
/**
 * pty_spawn tool parameters schema
 */
export declare const ptySpawnSchema: z.ZodObject<{
    command: z.ZodString;
    args: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    workdir: z.ZodOptional<z.ZodString>;
    env: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    title: z.ZodOptional<z.ZodString>;
    description: z.ZodString;
    notifyOnExit: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
}, "strip", z.ZodTypeAny, {
    command: string;
    description: string;
    notifyOnExit: boolean;
    args?: string[] | undefined;
    workdir?: string | undefined;
    env?: Record<string, string> | undefined;
    title?: string | undefined;
}, {
    command: string;
    description: string;
    args?: string[] | undefined;
    workdir?: string | undefined;
    env?: Record<string, string> | undefined;
    title?: string | undefined;
    notifyOnExit?: boolean | undefined;
}>;
export type PTYSpawnArgs = z.infer<typeof ptySpawnSchema>;
/**
 * pty_spawn tool description
 */
export declare const ptySpawnDescription = "Spawns a new interactive PTY (pseudo-terminal) session that runs in the background.\n\nUnlike synchronous command execution, PTY sessions persist and allow you to:\n- Run long-running processes (dev servers, watch modes, etc.)\n- Send interactive input (including Ctrl+C, arrow keys, etc.)\n- Read output at any time\n- Manage multiple concurrent terminal sessions\n\nUsage:\n- The `command` parameter is required (e.g., \"npm\", \"python\", \"bash\")\n- Use `args` to pass arguments to the command (e.g., [\"run\", \"dev\"])\n- Use `workdir` to set the working directory (defaults to project root)\n- Use `env` to set additional environment variables\n- Use `title` to give the session a human-readable name\n- The `description` parameter is required: a clear, concise 5-10 word description\n- Use `notifyOnExit` to receive a log message when the process exits (default: false)\n\nReturns the session info including:\n- `id`: Unique identifier (pty_XXXXXXXX) for use with other pty_* tools\n- `pid`: Process ID\n- `status`: Current status (\"running\")\n\nAfter spawning, use:\n- `pty_write` to send input to the PTY\n- `pty_read` to read output from the PTY\n- `pty_list` to see all active PTY sessions\n- `pty_kill` to terminate the PTY\n\nExit Notifications:\nWhen `notifyOnExit` is true, you will receive a log message when the process exits containing:\n- Session ID and title\n- Exit code\n- Total output lines\n- Last line of output (truncated to 250 chars)\n\nThis is useful for long-running processes where you want to be notified when they complete\ninstead of polling with `pty_read`.\n- Completion signal is the future `<pty_exited>` log message\n- If you only need to know whether the command finished, do not call `pty_read`; wait for `<pty_exited>`\n- Never use sleep plus `pty_read` loops to check completion\n- Use `pty_read` before exit only if you need live output now, the user explicitly asks for logs, or the exit notification reports a non-zero status and you need to investigate";
/**
 * Execute pty_spawn tool
 */
export declare function executePTYSpawn(args: PTYSpawnArgs): Promise<string>;
//# sourceMappingURL=spawn.d.ts.map