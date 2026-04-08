import { z } from 'zod';
/**
 * pty_list tool parameters schema (empty - no parameters required)
 */
export declare const ptyListSchema: z.ZodObject<{}, "strip", z.ZodTypeAny, {}, {}>;
export type PTYListArgs = z.infer<typeof ptyListSchema>;
/**
 * pty_list tool description
 */
export declare const ptyListDescription = "Lists all PTY sessions (active and exited).\n\nUse this tool to:\n- See all running and exited PTY sessions\n- Get session IDs for use with other pty_* tools\n- Check the status and output line count of each session\n- Monitor which processes are still running\n\nReturns for each session:\n- id: Unique identifier for use with other tools\n- title: Human-readable name\n- command: The command that was executed\n- status: Current status (running, exited, killed)\n- exitCode: Exit code (if exited/killed)\n- pid: Process ID\n- lineCount: Number of lines in the output buffer\n- createdAt: When the session was created\n\nTips:\n- Use the session ID with pty_read, pty_write, or pty_kill\n- Sessions remain in the list after exit until explicitly cleaned up with pty_kill\n- This allows you to compare output from multiple sessions";
/**
 * Execute pty_list tool
 */
export declare function executePTYList(args?: PTYListArgs): Promise<string>;
//# sourceMappingURL=list.d.ts.map