import { z } from 'zod';
/**
 * pty_read tool parameters schema
 */
export declare const ptyReadSchema: z.ZodObject<{
    id: z.ZodString;
    offset: z.ZodOptional<z.ZodNumber>;
    limit: z.ZodOptional<z.ZodNumber>;
    pattern: z.ZodOptional<z.ZodString>;
    ignoreCase: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    id: string;
    offset?: number | undefined;
    limit?: number | undefined;
    pattern?: string | undefined;
    ignoreCase?: boolean | undefined;
}, {
    id: string;
    offset?: number | undefined;
    limit?: number | undefined;
    pattern?: string | undefined;
    ignoreCase?: boolean | undefined;
}>;
export type PTYReadArgs = z.infer<typeof ptyReadSchema>;
/**
 * pty_read tool description
 */
export declare const ptyReadDescription = "Reads output from a PTY session's buffer.\n\nThe PTY maintains a rolling buffer of output lines. Use offset and limit to paginate through the output, similar to reading a file.\n\nUsage:\n- id: The PTY session ID (from pty_spawn or pty_list)\n- offset: Line number to start reading from (0-based, defaults to 0)\n- limit: Number of lines to read (defaults to 500)\n- pattern: Regex pattern to filter lines (optional)\n- ignoreCase: Case-insensitive pattern matching (default: false)\n\nReturns:\n- Numbered lines of output (similar to cat -n format)\n- Total line count in the buffer\n- Indicator if more lines are available\n\nPattern Filtering:\n- When pattern is set, lines are FILTERED FIRST using the regex, then offset/limit apply to the MATCHES\n- Original line numbers are preserved so you can see where matches occurred in the buffer\n- Supports full regex syntax (e.g., \"error\", \"ERROR|WARN\", \"failed.*connection\", etc.)\n\nTips:\n- To see the latest output, use a high offset or omit offset to read from the start\n- To tail recent output, calculate offset as (totalLines - N) where N is how many recent lines you want\n- Lines longer than 2000 characters are truncated\n- If the session was started with notifyOnExit=true, do not use repeated pty_read calls only to detect completion";
/**
 * Execute pty_read tool
 */
export declare function executePTYRead(args: PTYReadArgs): Promise<string>;
//# sourceMappingURL=read.d.ts.map