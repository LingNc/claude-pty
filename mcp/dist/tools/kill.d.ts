import { z } from 'zod';
/**
 * pty_kill tool parameters schema
 */
export declare const ptyKillSchema: z.ZodObject<{
    id: z.ZodString;
    cleanup: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
}, "strip", z.ZodTypeAny, {
    id: string;
    cleanup: boolean;
}, {
    id: string;
    cleanup?: boolean | undefined;
}>;
export type PTYKillArgs = z.infer<typeof ptyKillSchema>;
/**
 * pty_kill tool description
 */
export declare const ptyKillDescription = "Terminates a PTY session and optionally cleans up its buffer.\n\nUse this tool to:\n- Stop a running process (sends SIGTERM)\n- Clean up an exited session to free memory\n- Remove a session from the list\n\nUsage:\n- id: The PTY session ID (from pty_spawn or pty_list)\n- cleanup: If true, removes the session and frees the buffer (default: false)\n\nBehavior:\n- If the session is running, it will be killed (status becomes \"killed\")\n- If cleanup=false (default), the session remains in the list with its output buffer intact\n- If cleanup=true, the session is removed entirely and the buffer is freed\n- Keeping sessions without cleanup allows you to compare logs between runs\n\nTips:\n- Use cleanup=false if you might want to read the output later\n- Use cleanup=true when you're done with the session entirely\n- To send Ctrl+C instead of killing, use pty_write with data=\"\\x03\"\n\nExamples:\n- Kill but keep logs: cleanup=false (or omit)\n- Kill and remove: cleanup=true";
/**
 * Execute pty_kill tool
 */
export declare function executePTYKill(args: PTYKillArgs): Promise<string>;
//# sourceMappingURL=kill.d.ts.map