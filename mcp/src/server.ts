#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { registerTools } from './tools/index.js';

// 服务器配置
const SERVER_NAME = 'claude-pty-mcp';
const SERVER_VERSION = '0.1.0';

/**
 * 创建并启动MCP服务器
 */
async function main() {
  // 创建MCP服务器实例
  const server = new Server(
    {
      name: SERVER_NAME,
      version: SERVER_VERSION,
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // 注册所有PTY工具
  registerTools(server);

  // 创建stdio传输层
  const transport = new StdioServerTransport();

  // 连接服务器到传输层
  await server.connect(transport);

  // 输出到stderr（stdout用于MCP通信）
  console.error(`MCP PTY Server '${SERVER_NAME}' v${SERVER_VERSION} running on stdio`);
}

// 启动服务器
main().catch((error) => {
  console.error('Fatal error starting MCP server:', error);
  process.exit(1);
});
