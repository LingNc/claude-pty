import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

// Import all tool schemas, descriptions, and execute functions
import {
  ptySpawnSchema,
  ptySpawnDescription,
  executePTYSpawn,
  type PTYSpawnArgs,
} from './spawn.js';

import {
  ptyReadSchema,
  ptyReadDescription,
  executePTYRead,
  type PTYReadArgs,
} from './read.js';

import {
  ptyWriteSchema,
  ptyWriteDescription,
  executePTYWrite,
  type PTYWriteArgs,
} from './write.js';

import {
  ptyKillSchema,
  ptyKillDescription,
  executePTYKill,
  type PTYKillArgs,
} from './kill.js';

import {
  ptyListSchema,
  ptyListDescription,
  executePTYList,
  type PTYListArgs,
} from './list.js';

/**
 * Register all PTY tools with the MCP server
 */
export function registerTools(server: McpServer) {
  // pty_spawn - Create new PTY session
  server.registerTool('pty_spawn', {
    description: ptySpawnDescription,
    inputSchema: ptySpawnSchema as unknown as z.ZodType<PTYSpawnArgs>,
  }, async (args) => {
    const result = await executePTYSpawn(args);
    return { content: [{ type: 'text', text: result }] };
  });

  // pty_read - Read output from PTY session
  server.registerTool('pty_read', {
    description: ptyReadDescription,
    inputSchema: ptyReadSchema as unknown as z.ZodType<PTYReadArgs>,
  }, async (args) => {
    const result = await executePTYRead(args);
    return { content: [{ type: 'text', text: result }] };
  });

  // pty_write - Send input to PTY session
  server.registerTool('pty_write', {
    description: ptyWriteDescription,
    inputSchema: ptyWriteSchema as unknown as z.ZodType<PTYWriteArgs>,
  }, async (args) => {
    const result = await executePTYWrite(args);
    return { content: [{ type: 'text', text: result }] };
  });

  // pty_kill - Terminate PTY session
  server.registerTool('pty_kill', {
    description: ptyKillDescription,
    inputSchema: ptyKillSchema as unknown as z.ZodType<PTYKillArgs>,
  }, async (args) => {
    const result = await executePTYKill(args);
    return { content: [{ type: 'text', text: result }] };
  });

  // pty_list - List all PTY sessions
  server.registerTool('pty_list', {
    description: ptyListDescription,
    inputSchema: ptyListSchema as unknown as z.ZodType<PTYListArgs>,
  }, async (args) => {
    const result = await executePTYList(args);
    return { content: [{ type: 'text', text: result }] };
  });

  console.error('Registered 5 PTY tools: pty_spawn, pty_read, pty_write, pty_kill, pty_list');
}
