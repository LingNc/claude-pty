# MCP 迁移计划

## 1. 迁移概述

### 1.1 迁移目标

将现有的 Claude Code Plugin 架构扩展支持 MCP (Model Context Protocol) 服务器，使 PTY 工具可以通过 MCP 协议被 Claude Code 和其他支持 MCP 的客户端调用。

### 1.2 迁移范围

| 组件 | 迁移方式 | 工作量 |
|------|----------|--------|
| 5个PTY工具 | 重写为MCP格式 | 中等 |
| PTY核心管理器 | 复用 | 低 |
| 权限系统 | 简化适配 | 中等 |
| 通知机制 | 改为stderr输出 | 低 |

### 1.3 时间表

```
Phase 1: 基础架构 (2-3天)
Phase 2: 工具迁移 (3-4天)
Phase 3: 测试验证 (2天)
Phase 4: 文档完善 (1天)
─────────────────────────
总计: 8-10天
```

## 2. 阶段规划

### Phase 1: MCP基础架构 (Day 1-3)

#### 任务 1.1: 初始化MCP项目结构
**负责人**: Coder
**工时**: 4h
**依赖**: 无

```bash
mkdir -p mcp/src/tools mcp/src/shared mcp/scripts
cp src/pty/types.ts mcp/src/shared/
```

**产出**:
- mcp/package.json
- mcp/tsconfig.json
- mcp/README.md

#### 任务 1.2: 安装MCP SDK依赖
**负责人**: Coder
**工时**: 2h
**依赖**: 1.1

```json
{
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.0.0",
    "zod": "^3.22.0",
    "bun-pty": "^0.4.8"
  }
}
```

#### 任务 1.3: 实现MCP服务器入口
**负责人**: Coder
**工时**: 4h
**依赖**: 1.2

**文件**: `mcp/src/server.ts`

```typescript
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { registerTools } from './tools/index.js';

const server = new Server({
  name: 'claude-pty-mcp',
  version: '0.1.0',
}, {
  capabilities: { tools: {} },
});

// 注册所有工具
registerTools(server);

// 启动服务器
const transport = new StdioServerTransport();
await server.connect(transport);
console.error('MCP PTY Server running on stdio');
```

**风险**: 🟡 需确保stdio传输正常工作

---

### Phase 2: 工具迁移 (Day 4-7)

#### 任务 2.1: 迁移 pty_spawn
**负责人**: Coder
**工时**: 6h
**依赖**: 1.3

**变更点**:
1. 参数验证: 对象类型 → Zod Schema
2. 移除context参数依赖
3. 移除context.notify调用
4. 适配MCP错误格式

**对比**:

```typescript
// Plugin版本 (src/tools/spawn.ts)
export const ptySpawnTool = defineTool({
  name: 'pty_spawn',
  parameters: { /* 对象类型 */ },
  async execute(args, context) {
    // 使用 context.sessionId, context.notify
  }
});

// MCP版本 (mcp/src/tools/spawn.ts)
import { z } from 'zod';

const SpawnParams = z.object({
  command: z.string(),
  args: z.array(z.string()).optional(),
  workdir: z.string().optional(),
  env: z.record(z.string()).optional(),
  title: z.string().optional(),
  description: z.string(),
  notifyOnExit: z.boolean().optional(),
});

export function registerPtySpawn(server: Server) {
  server.registerTool({
    name: 'pty_spawn',
    description: '...',
    parameters: SpawnParams,
    async execute(args) {
      // 移除context依赖
      // 使用stderr替代notify
    }
  });
}
```

**风险**: 🔴 notify机制变更影响用户体验

#### 任务 2.2: 迁移 pty_read
**负责人**: Coder
**工时**: 4h
**依赖**: 2.1

**变更点**:
1. 参数验证改为Zod
2. 保持核心逻辑不变

#### 任务 2.3: 迁移 pty_write
**负责人**: Coder
**工时**: 3h
**依赖**: 2.1

**变更点**:
1. 参数验证改为Zod
2. 移除context依赖

#### 任务 2.4: 迁移 pty_kill
**负责人**: Coder
**工时**: 2h
**依赖**: 2.1

**变更点**:
1. 参数验证改为Zod
2. 简化实现

#### 任务 2.5: 迁移 pty_list
**负责人**: Coder
**工时**: 2h
**依赖**: 2.1

**变更点**:
1. 参数验证改为Zod
2. 无参数版本也需要Zod定义

```typescript
const ListParams = z.object({}).optional(); // 无参数
```

#### 任务 2.6: 创建工具注册中心
**负责人**: Coder
**工时**: 2h
**依赖**: 2.1-2.5

**文件**: `mcp/src/tools/index.ts`

```typescript
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { registerPtySpawn } from './spawn.js';
import { registerPtyRead } from './read.js';
import { registerPtyWrite } from './write.js';
import { registerPtyKill } from './kill.js';
import { registerPtyList } from './list.js';

export function registerTools(server: Server) {
  registerPtySpawn(server);
  registerPtyRead(server);
  registerPtyWrite(server);
  registerPtyKill(server);
  registerPtyList(server);
}
```

---

### Phase 3: 核心模块适配 (Day 8)

#### 任务 3.1: 适配权限系统
**负责人**: Coder
**工时**: 3h
**依赖**: Phase 2完成

**变更**: `src/permissions.ts` → `mcp/src/shared/permissions.ts`

- 移除Claude Code特定API依赖
- 改为简单的允许列表模式
- 或者完全移除（MCP通常由客户端控制权限）

**决策**: 🟡 建议简化权限检查，依赖MCP客户端控制

#### 任务 3.2: 适配通知机制
**负责人**: Coder
**工时**: 2h
**依赖**: 3.1

**变更点**:
- 移除 `context.notify` 调用
- 改为 `console.error()` 输出到stderr
- 或者使用MCP日志协议

```typescript
// 替代方案
console.error(`PTY Exit: Session ${sessionId} exited with code ${exitCode}`);
```

#### 任务 3.3: 复用PTY核心模块
**负责人**: Coder
**工时**: 2h
**依赖**: 3.2

**操作**:
```bash
# 创建符号链接或复制
ln -s ../../src/pty mcp/src/pty
# 或
cp -r src/pty/* mcp/src/pty/
```

**复用模块**:
- manager.ts
- session-lifecycle.ts
- output-manager.ts
- buffer.ts
- types.ts

---

### Phase 4: 测试验证 (Day 9)

#### 任务 4.1: MCP服务器单元测试
**负责人**: Tester
**工时**: 4h
**依赖**: Phase 3

**测试内容**:
1. 服务器启动
2. 工具注册
3. 参数验证
4. 错误处理

#### 任务 4.2: 集成测试
**负责人**: Tester
**工时**: 4h
**依赖**: 4.1

**测试场景**:
1. 完整workflow: spawn → write → read → kill
2. 多会话管理
3. 错误处理
4. 并发测试

#### 任务 4.3: Claude Code集成测试
**负责人**: Tester
**工时**: 4h
**依赖**: 4.2

**配置**:
```json
// .mcp.json
{
  "mcpServers": {
    "claude-pty": {
      "command": "node",
      "args": ["./mcp/dist/server.js"]
    }
  }
}
```

---

### Phase 5: 文档与发布 (Day 10)

#### 任务 5.1: 更新README文档
**负责人**: Analyst
**工时**: 2h
**依赖**: Phase 4

**内容**:
- MCP安装说明
- 配置示例
- 使用指南

#### 任务 5.2: 创建发布包
**负责人**: Coder
**工时**: 2h
**依赖**: 5.1

**操作**:
```bash
npm run build:mcp
npm publish
```

## 3. 风险与缓解

### 高风险

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| notify机制移除 | 用户无法收到进程退出通知 | 使用stderr输出，或文档说明 |
| context.sessionId缺失 | 无法追踪父会话 | 使用独立session ID生成 |
| 权限系统简化 | 安全风险 | 依赖MCP客户端权限控制 |

### 中风险

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| Zod参数验证差异 | 参数校验失败 | 详细测试所有参数类型 |
| 错误格式不兼容 | 错误信息丢失 | 统一错误格式处理 |

## 4. 回滚计划

如果MCP迁移失败，保留Plugin版本作为后备:

```
src/          # Plugin版本（保留）
mcp/          # MCP版本（新增）
```

用户可以选择使用:
- Plugin方式: `/plugin install claude-pty`
- MCP方式: 配置 .mcp.json

## 5. 成功标准

- [ ] MCP服务器可以通过stdio启动
- [ ] 5个工具全部可用
- [ ] 与Claude Code集成成功
- [ ] 所有测试通过
- [ ] 文档完整

---

*计划版本: 1.0*
*创建时间: 2026-04-08*
