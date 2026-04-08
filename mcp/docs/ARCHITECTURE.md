# MCP 迁移架构设计

## 1. 现有架构分析

### 1.1 插件架构概览

```
┌─────────────────────────────────────────────────────────────────┐
│                     Claude Code Plugin                          │
├─────────────────────────────────────────────────────────────────┤
│  src/index.ts                                                    │
│    ├── definePlugin()                                            │
│    ├── tools: [ptySpawnTool, ptyRead, ptyWrite, ptyKill, ptyList]│
│    ├── commands: [ptyOpenCommand, ptyShowUrlCommand]             │
│    └── onSessionDeleted()                                        │
│                                                                  │
│  src/tools/*.ts                                                  │
│    ├── spawn.ts  - pty_spawn (defineTool)                        │
│    ├── read.ts   - pty_read                                      │
│    ├── write.ts  - pty_write                                     │
│    ├── kill.ts   - pty_kill                                      │
│    └── list.ts   - pty_list                                      │
│                                                                  │
│  src/pty/                                                        │
│    ├── manager.ts         - PTY核心管理器                         │
│    ├── session-lifecycle.ts - 会话生命周期                        │
│    ├── output-manager.ts  - 输出管理                              │
│    ├── buffer.ts          - RingBuffer                            │
│    ├── notification-manager.ts - 通知管理                         │
│    └── types.ts           - 类型定义                              │
│                                                                  │
│  src/permissions.ts       - 权限检查                               │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 工具实现分析

| 工具 | 核心功能 | 依赖模块 | 复杂度 |
|------|----------|----------|--------|
| pty_spawn | 创建PTY会话 | manager, permissions | 高 |
| pty_read | 读取输出 | manager, lifecycle | 高 |
| pty_write | 发送输入 | manager, lifecycle | 中 |
| pty_kill | 终止会话 | manager, lifecycle | 低 |
| pty_list | 列出会话 | manager | 低 |

### 1.3 核心依赖关系

```
src/tools/spawn.ts
    ├── src/pty/manager.ts
    │   ├── src/pty/session-lifecycle.ts
    │   ├── src/pty/output-manager.ts
    │   └── src/pty/notification-manager.ts
    ├── src/permissions.ts
    └── bun-pty (外部依赖)
```

## 2. MCP SDK 研究

### 2.1 MCP 架构对比

| 特性 | Claude Code Plugin | MCP Server |
|------|-------------------|------------|
| 注册方式 | defineTool() | server.registerTool() |
| 参数验证 | 对象类型定义 | Zod Schema |
| 传输方式 | 内部集成 | stdio / sse |
| 上下文访问 | context参数 | 无直接上下文 |
| 生命周期 | 插件onSessionDeleted | 服务器进程生命周期 |

### 2.2 MCP SDK API

```typescript
// MCP 工具定义方式
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

const server = new Server({
  name: 'claude-pty-mcp',
  version: '0.1.0',
}, {
  capabilities: { tools: {} },
});

// 工具注册
server.registerTool({
  name: 'pty_spawn',
  description: 'Spawn a new PTY session',
  parameters: z.object({
    command: z.string(),
    args: z.array(z.string()).optional(),
    workdir: z.string().optional(),
    env: z.record(z.string()).optional(),
    title: z.string().optional(),
    description: z.string(),
    notifyOnExit: z.boolean().optional(),
  }),
  async execute(args) {
    // 工具实现
  },
});

// 启动服务器
const transport = new StdioServerTransport();
server.connect(transport);
```

### 2.3 关键差异分析

1. **参数验证**: Plugin使用TypeScript类型，MCP要求Zod Schema
2. **上下文访问**: Plugin有context参数，MCP无直接上下文
3. **通知机制**: Plugin有context.notify，MCP需通过日志/stderr
4. **会话管理**: Plugin有onSessionDeleted，MCP需手动管理

## 3. MCP 服务器架构设计

### 3.1 目录结构

```
mcp/
├── ARCHITECTURE.md           # 本文档
├── MIGRATION_PLAN.md         # 迁移计划
├── TASKS.md                  # 任务清单
├── README.md                 # MCP服务器说明
├── package.json              # MCP独立依赖
├── tsconfig.json             # TypeScript配置
├── src/
│   ├── server.ts             # MCP服务器入口
│   ├── tools/                # MCP工具实现
│   │   ├── index.ts          # 工具注册中心
│   │   ├── spawn.ts          # pty_spawn MCP版本
│   │   ├── read.ts           # pty_read MCP版本
│   │   ├── write.ts          # pty_write MCP版本
│   │   ├── kill.ts           # pty_kill MCP版本
│   │   └── list.ts           # pty_list MCP版本
│   └── shared/               # 与插件共享的代码
│       └── types.ts          # MCP相关类型
└── scripts/
    └── start.sh              # MCP启动脚本
```

### 3.2 架构设计原则

```
┌─────────────────────────────────────────────────────────────────┐
│                    MCP Server Architecture                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌─────────────┐                                               │
│   │   Claude    │  ← 通过stdio调用MCP工具                        │
│   │   Code      │                                               │
│   └──────┬──────┘                                               │
│          │ stdio                                                 │
│          ▼                                                       │
│   ┌─────────────┐                                               │
│   │  MCP Server │  ← @modelcontextprotocol/sdk                   │
│   │  (stdio)    │                                               │
│   └──────┬──────┘                                               │
│          │                                                       │
│          ▼                                                       │
│   ┌──────────────────────────────────────┐                      │
│   │         MCP Tools Layer               │                      │
│   │  ┌─────────┐ ┌─────────┐ ┌─────────┐ │                      │
│   │  │ pty_spawn│ │ pty_read │ │ pty_write│ │                      │
│   │  └────┬────┘ └────┬────┘ └────┬────┘ │                      │
│   │       └───────────┼───────────┘      │                      │
│   │                   ▼                  │                      │
│   │        ┌─────────────────┐           │                      │
│   │        │   PTY Manager   │           │                      │
│   │        │   (复用核心)     │           │                      │
│   │        └─────────────────┘           │                      │
│   └──────────────────────────────────────┘                      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 3.3 代码复用策略

```
复用级别分析:

🔴 需要重写:
  - src/tools/*.ts → mcp/src/tools/*.ts
    (API差异: defineTool vs server.registerTool)
  - src/index.ts → mcp/src/server.ts
    (入口点完全不同)

🟡 需要适配:
  - src/permissions.ts
    (移除Claude Code特定API依赖)
  - src/pty/notification-manager.ts
    (移除context.notify依赖)

🟢 可直接复用:
  - src/pty/manager.ts
  - src/pty/session-lifecycle.ts
  - src/pty/output-manager.ts
  - src/pty/buffer.ts
  - src/pty/types.ts
```

## 4. 工具映射设计

### 4.1 工具映射表

| Plugin Tool | MCP Tool | 状态 | 主要变更 |
|-------------|----------|------|----------|
| pty_spawn | pty_spawn | 迁移 | 参数验证改为Zod，移除context依赖 |
| pty_read | pty_read | 迁移 | 参数验证改为Zod |
| pty_write | pty_write | 迁移 | 参数验证改为Zod |
| pty_kill | pty_kill | 迁移 | 参数验证改为Zod |
| pty_list | pty_list | 迁移 | 参数验证改为Zod |

### 4.2 参数映射对比

**pty_spawn 参数对比:**

```typescript
// Plugin版本
parameters: {
  command: { type: 'string', description: '...' },
  args: { type: 'array', items: { type: 'string' } },
  // ...
}

// MCP版本
parameters: z.object({
  command: z.string().describe('The command to run'),
  args: z.array(z.string()).optional(),
  workdir: z.string().optional(),
  env: z.record(z.string()).optional(),
  title: z.string().optional(),
  description: z.string().describe('Clear description'),
  notifyOnExit: z.boolean().optional().default(false),
})
```

## 5. 依赖关系图

### 5.1 模块依赖图

```
mcp/src/server.ts
    ├── @modelcontextprotocol/sdk
    │   ├── Server
    │   └── StdioServerTransport
    ├── mcp/src/tools/index.ts
    │   ├── mcp/src/tools/spawn.ts
    │   │   └── src/pty/manager.ts (复用)
    │   ├── mcp/src/tools/read.ts
    │   │   └── src/pty/manager.ts (复用)
    │   ├── mcp/src/tools/write.ts
    │   │   └── src/pty/manager.ts (复用)
    │   ├── mcp/src/tools/kill.ts
    │   │   └── src/pty/manager.ts (复用)
    │   └── mcp/src/tools/list.ts
    │       └── src/pty/manager.ts (复用)
    └── zod (参数验证)
```

### 5.2 运行时架构

```
┌─────────────────────────────────────────────────────────────────┐
│                     Runtime Architecture                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   Claude Code Process          MCP Server Process               │
│   ┌──────────────────┐         ┌──────────────────┐             │
│   │                  │  stdio  │                  │             │
│   │  MCP Client      │◄───────►│  MCP Server      │             │
│   │  (内置)          │         │  (Node/Bun)      │             │
│   │                  │         │                  │             │
│   └──────────────────┘         └────────┬─────────┘             │
│                                          │                      │
│                                          ▼                      │
│                              ┌──────────────────┐               │
│                              │  PTY Sessions    │               │
│                              │  (bun-pty)       │               │
│                              └──────────────────┘               │
│                                                                  │
│   通信协议: JSON-RPC over stdio                                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## 6. 重构点清单

### 6.1 高风险重构

| 模块 | 重构内容 | 风险等级 | 影响范围 |
|------|----------|----------|----------|
| tools/spawn.ts | 改为MCP registerTool格式 | 中 | 核心功能 |
| permissions.ts | 移除CC特定API | 中 | 安全控制 |
| notification | 改为stderr输出 | 低 | 用户体验 |

### 6.2 适配点清单

1. **参数验证迁移**: 所有工具参数验证从对象类型改为Zod Schema
2. **上下文移除**: 移除所有context参数依赖（context.sessionId, context.notify）
3. **错误处理**: 适配MCP错误格式
4. **日志输出**: 使用stderr替代context.notify

### 6.3 复用点清单

✅ 可直接复用:
- `src/pty/manager.ts` - 核心管理器
- `src/pty/session-lifecycle.ts` - 生命周期管理
- `src/pty/output-manager.ts` - 输出处理
- `src/pty/buffer.ts` - RingBuffer实现
- `src/pty/types.ts` - 类型定义

## 7. 并存策略

### 7.1 插件与MCP并存方案

```
项目结构:
claude-pty/
├── src/                    # Claude Code Plugin (保留)
│   ├── index.ts
│   ├── tools/
│   ├── pty/
│   └── ...
├── mcp/                    # MCP Server (新增)
│   ├── src/
│   │   ├── server.ts
│   │   └── tools/
│   └── ...
├── package.json            # 双入口配置
└── README.md
```

### 7.2 构建配置

```json
// package.json
{
  "main": "./dist/index.js",
  "exports": {
    ".": "./dist/index.js",
    "./mcp": "./mcp/dist/server.js"
  },
  "bin": {
    "claude-pty-mcp": "./mcp/dist/server.js"
  }
}
```

## 8. 关键决策

### 8.1 决策记录

| 决策 | 选择 | 理由 |
|------|------|------|
| 工具数量 | 保持5个 | 功能完整，用户习惯 |
| 参数验证 | Zod | MCP标准要求 |
| 通知机制 | stderr输出 | MCP限制，可观察 |
| 会话生命周期 | 进程生命周期 | MCP Server存活期间 |
| 权限系统 | 简化版 | 移除CC特定配置 |

### 8.2 待确认问题

1. MCP Server是否支持exit notification？
2. 如何处理长时间运行的PTY会话？
3. 是否需要支持多并发会话？
4. 错误信息格式如何标准化？

---

*文档版本: 1.0*
*创建时间: 2026-04-08*
*作者: Analyst*
