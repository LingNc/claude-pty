// Import all tool schemas, descriptions, and execute functions
import { ptySpawnSchema, ptySpawnDescription, executePTYSpawn, } from './spawn.js';
import { ptyReadSchema, ptyReadDescription, executePTYRead, } from './read.js';
import { ptyWriteSchema, ptyWriteDescription, executePTYWrite, } from './write.js';
import { ptyKillSchema, ptyKillDescription, executePTYKill, } from './kill.js';
import { ptyListSchema, ptyListDescription, executePTYList, } from './list.js';
/**
 * Register all PTY tools with the MCP server
 */
export function registerTools(server) {
    // pty_spawn - Create new PTY session
    server.registerTool('pty_spawn', {
        description: ptySpawnDescription,
        inputSchema: ptySpawnSchema,
    }, async (args) => {
        const result = await executePTYSpawn(args);
        return { content: [{ type: 'text', text: result }] };
    });
    // pty_read - Read output from PTY session
    server.registerTool('pty_read', {
        description: ptyReadDescription,
        inputSchema: ptyReadSchema,
    }, async (args) => {
        const result = await executePTYRead(args);
        return { content: [{ type: 'text', text: result }] };
    });
    // pty_write - Send input to PTY session
    server.registerTool('pty_write', {
        description: ptyWriteDescription,
        inputSchema: ptyWriteSchema,
    }, async (args) => {
        const result = await executePTYWrite(args);
        return { content: [{ type: 'text', text: result }] };
    });
    // pty_kill - Terminate PTY session
    server.registerTool('pty_kill', {
        description: ptyKillDescription,
        inputSchema: ptyKillSchema,
    }, async (args) => {
        const result = await executePTYKill(args);
        return { content: [{ type: 'text', text: result }] };
    });
    // pty_list - List all PTY sessions
    server.registerTool('pty_list', {
        description: ptyListDescription,
        inputSchema: ptyListSchema,
    }, async (args) => {
        const result = await executePTYList(args);
        return { content: [{ type: 'text', text: result }] };
    });
    console.error('Registered 5 PTY tools: pty_spawn, pty_read, pty_write, pty_kill, pty_list');
}
//# sourceMappingURL=index.js.map