import { z } from 'zod';
/**
 * pty_write tool parameters schema
 */
export declare const ptyWriteSchema: z.ZodObject<{
    id: z.ZodString;
    data: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
    data: string;
}, {
    id: string;
    data: string;
}>;
export type PTYWriteArgs = z.infer<typeof ptyWriteSchema>;
/**
 * pty_write tool description
 */
export declare const ptyWriteDescription = "Write data to an active PTY session. Use this tool to:\n- Type commands or text into an interactive terminal\n- Send special key sequences (Ctrl+C, Enter, arrow keys, etc.)\n- Respond to prompts in interactive programs\n\nUsage:\n- id: The PTY session ID (from pty_spawn or pty_list)\n- data: The input to send (text, commands, or escape sequences)\n\nCommon escape sequences:\n- Enter/newline: \\n or \\r\n- Ctrl+C (interrupt): \\x03\n- Ctrl+D (EOF): \\x04\n- Tab: \\t\n- Arrow Up: \\x1b[A\n- Arrow Down: \\x1b[B\n- Arrow Right: \\x1b[C\n- Arrow Left: \\x1b[D\n\nReturns success or error message.\n\nExamples:\n- Send a command: data=\"ls -la\\n\"\n- Interrupt a process: data=\"\\x03\"\n- Answer a prompt: data=\"yes\\n\"";
/**
 * Execute pty_write tool
 */
export declare function executePTYWrite(args: PTYWriteArgs): Promise<string>;
//# sourceMappingURL=write.d.ts.map