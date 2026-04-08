import { Server } from '@modelcontextprotocol/sdk/server/index.js';
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
export function registerTools(server: Server) {
  // pty_spawn - Create new PTY session
  server.registerTool({
    name: 'pty_spawn',
    description: ptySpawnDescription,
    parameters: ptySpawnSchema as unknown as z.ZodType<PTYSpawnArgs>,
    execute: executePTYSpawn,
  });

  // pty_read - Read output from PTY session
  server.registerTool({
    name: 'pty_read',
    description: ptyReadDescription,
    parameters: ptyReadSchema as unknown as z.ZodType<PTYReadArgs>,
    execute: executePTYRead,
  });

  // pty_write - Send input to PTY session
  server.registerTool({
    name: 'pty_write',
    description: ptyWriteDescription,
    parameters: ptyWriteSchema as unknown as z.ZodType<PTYWriteArgs>,
    execute: executePTYWrite,
  });

  // pty_kill - Terminate PTY session
  server.registerTool({
    name: 'pty_kill',
    description: ptyKillDescription,
    parameters: ptyKillSchema as unknown as z.ZodType<PTYKillArgs>,
    execute: executePTYKill,
  });

  // pty_list - List all PTY sessions
  server.registerTool({
    name: 'pty_list',
    description: ptyListDescription,
    parameters: ptyListSchema as unknown as z.ZodType<PTYListArgs>,
    execute: executePTYList,
  });

  console.error('Registered 5 PTY tools: pty_spawn, pty_read, pty_write, pty_kill, pty_list');
}
