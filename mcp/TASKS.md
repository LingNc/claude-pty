# MCP 迁移任务清单

## 任务概览

| ID | 任务名称 | 负责人 | 工时 | 状态 | 阻塞项 |
|----|----------|--------|------|------|--------|
| T1 | 初始化MCP项目结构 | Coder | 4h | ⏳ | - |
| T2 | 安装MCP SDK依赖 | Coder | 2h | ⏳ | T1 |
| T3 | 实现MCP服务器入口 | Coder | 4h | ⏳ | T2 |
| T4 | 迁移 pty_spawn 工具 | Coder | 6h | ⏳ | T3 |
| T5 | 迁移 pty_read 工具 | Coder | 4h | ⏳ | T3 |
| T6 | 迁移 pty_write 工具 | Coder | 3h | ⏳ | T3 |
| T7 | 迁移 pty_kill 工具 | Coder | 2h | ⏳ | T3 |
| T8 | 迁移 pty_list 工具 | Coder | 2h | ⏳ | T3 |
| T9 | 创建工具注册中心 | Coder | 2h | ⏳ | T4-T8 |
| T10 | 适配权限系统 | Coder | 3h | ⏳ | T9 |
| T11 | 适配通知机制 | Coder | 2h | ⏳ | T9 |
| T12 | 复用PTY核心模块 | Coder | 2h | ⏳ | T10-T11 |
| T13 | MCP服务器单元测试 | Tester | 4h | ⏳ | T12 |
| T14 | 集成测试 | Tester | 4h | ⏳ | T13 |
| T15 | CC集成测试 | Tester | 4h | ⏳ | T14 |
| T16 | 更新README文档 | Analyst | 2h | ⏳ | T15 |
| T17 | 创建发布包 | Coder | 2h | ⏳ | T16 |

---

## 详细任务说明

### Phase 1: 基础架构

#### T1: 初始化MCP项目结构
**负责人**: Coder  
**工时**: 4h  
**依赖**: -  
**状态**: ⏳

**描述**:
创建MCP服务器目录结构，复制必要的类型定义文件。

**子任务**:
- [ ] 创建 mcp/src/tools/ 目录
- [ ] 创建 mcp/src/shared/ 目录
- [ ] 创建 mcp/scripts/ 目录
- [ ] 复制 src/pty/types.ts 到 mcp/src/shared/
- [ ] 创建 mcp/package.json
- [ ] 创建 mcp/tsconfig.json

**验收标准**:
- 目录结构完整
- tsconfig配置正确

---

#### T2: 安装MCP SDK依赖
**负责人**: Coder  
**工时**: 2h  
**依赖**: T1  
**状态**: ⏳

**描述**:
在mcp目录下安装必要的依赖包。

**依赖清单**:
```json
{
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.0.0",
    "zod": "^3.22.0",
    "bun-pty": "^0.4.8"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0"
  }
}
```

**验收标准**:
- `bun install` 成功
- 无依赖冲突

---

#### T3: 实现MCP服务器入口
**负责人**: Coder  
**工时**: 4h  
**依赖**: T2  
**状态**: ⏳

**文件**: `mcp/src/server.ts`

**描述**:
实现MCP服务器主入口，配置stdio传输。

**代码模板**:
```typescript
#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

const server = new Server({
  name: 'claude-pty-mcp',
  version: '0.1.0',
}, {
  capabilities: { tools: {} },
});

// TODO: 注册工具

const transport = new StdioServerTransport();
await server.connect(transport);
console.error('MCP PTY Server started');
```

**验收标准**:
- 服务器可以启动
- 通过stdio通信
- 无启动错误

**风险**: 🟡 stdio传输配置

---

### Phase 2: 工具迁移

#### T4: 迁移 pty_spawn 工具
**负责人**: Coder  
**工时**: 6h  
**依赖**: T3  
**状态**: ⏳

**文件**: `mcp/src/tools/spawn.ts`

**描述**:
将Plugin版本的pty_spawn迁移为MCP工具格式。

**变更清单**:
- [ ] 创建Zod参数Schema
- [ ] 移除context参数
- [ ] 移除context.notify调用
- [ ] 使用stderr替代通知
- [ ] 适配错误格式
- [ ] 复用manager.spawn逻辑

**代码对比**:
```typescript
// Plugin: parameters: { command: { type: 'string' } }
// MCP: parameters: z.object({ command: z.string() })

// Plugin: async execute(args, context) { context.notify(...) }
// MCP: async execute(args) { console.error(...) }
```

**验收标准**:
- Zod验证通过
- 可以创建PTY会话
- 返回格式正确

**风险**: 🔴 notify机制变更

---

#### T5: 迁移 pty_read 工具
**负责人**: Coder  
**工时**: 4h  
**依赖**: T3  
**状态**: ⏳

**文件**: `mcp/src/tools/read.ts`

**描述**:
迁移pty_read工具。

**变更清单**:
- [ ] 创建Zod参数Schema
- [ ] 保留read/search逻辑
- [ ] 适配MCP返回格式

**参数Schema**:
```typescript
const ReadParams = z.object({
  id: z.string(),
  offset: z.number().optional(),
  limit: z.number().optional(),
  pattern: z.string().optional(),
  ignoreCase: z.boolean().optional(),
});
```

**验收标准**:
- 可以读取输出
- 支持pattern搜索

---

#### T6: 迁移 pty_write 工具
**负责人**: Coder  
**工时**: 3h  
**依赖**: T3  
**状态**: ⏳

**文件**: `mcp/src/tools/write.ts`

**描述**:
迁移pty_write工具。

**变更清单**:
- [ ] 创建Zod参数Schema
- [ ] 移除context.sessionId
- [ ] 复用write逻辑

**参数Schema**:
```typescript
const WriteParams = z.object({
  id: z.string(),
  data: z.string(),
});
```

**验收标准**:
- 可以发送输入
- 支持特殊字符

---

#### T7: 迁移 pty_kill 工具
**负责人**: Coder  
**工时**: 2h  
**依赖**: T3  
**状态**: ⏳

**文件**: `mcp/src/tools/kill.ts`

**描述**:
迁移pty_kill工具。

**变更清单**:
- [ ] 创建Zod参数Schema
- [ ] 复用kill逻辑

**参数Schema**:
```typescript
const KillParams = z.object({
  id: z.string(),
  cleanup: z.boolean().optional(),
});
```

**验收标准**:
- 可以终止会话

---

#### T8: 迁移 pty_list 工具
**负责人**: Coder  
**工时**: 2h  
**依赖**: T3  
**状态**: ⏳

**文件**: `mcp/src/tools/list.ts`

**描述**:
迁移pty_list工具。

**变更清单**:
- [ ] 创建Zod参数Schema（可为空）
- [ ] 复用list逻辑

**参数Schema**:
```typescript
const ListParams = z.object({}).optional();
```

**验收标准**:
- 返回会话列表

---

#### T9: 创建工具注册中心
**负责人**: Coder  
**工时**: 2h  
**依赖**: T4-T8  
**状态**: ⏳

**文件**: `mcp/src/tools/index.ts`

**描述**:
集中注册所有MCP工具。

**代码模板**:
```typescript
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { registerPtySpawn } from './spawn.js';
// ... other imports

export function registerTools(server: Server) {
  registerPtySpawn(server);
  registerPtyRead(server);
  registerPtyWrite(server);
  registerPtyKill(server);
  registerPtyList(server);
}
```

**验收标准**:
- 所有工具注册成功
- server.ts调用registerTools

---

### Phase 3: 核心适配

#### T10: 适配权限系统
**负责人**: Coder  
**工时**: 3h  
**依赖**: T9  
**状态**: ⏳

**文件**: `mcp/src/shared/permissions.ts`

**描述**:
简化权限系统，移除Claude Code特定API。

**变更清单**:
- [ ] 移除context.notify相关代码
- [ ] 改为简单允许列表
- [ ] 或完全移除（依赖MCP客户端）

**决策**: 🟡 建议简化，MCP客户端控制权限

**验收标准**:
- 无CC特定API依赖

---

#### T11: 适配通知机制
**负责人**: Coder  
**工时**: 2h  
**依赖**: T9  
**状态**: ⏳

**描述**:
替换context.notify为stderr输出。

**变更清单**:
- [ ] 查找所有notify调用
- [ ] 替换为console.error
- [ ] 或使用MCP日志协议

**代码变更**:
```typescript
// Before: context.notify({ message: '...' })
// After: console.error('...')
```

**验收标准**:
- 无context.notify依赖
- 通知可观察（stderr）

---

#### T12: 复用PTY核心模块
**负责人**: Coder  
**工时**: 2h  
**依赖**: T10-T11  
**状态**: ⏳

**描述**:
复用现有的PTY核心模块。

**操作**:
```bash
# 创建符号链接
ln -s ../../src/pty mcp/src/pty
```

**复用模块**:
- manager.ts
- session-lifecycle.ts
- output-manager.ts
- buffer.ts
- types.ts

**验收标准**:
- 无编译错误
- 可以正常导入

---

### Phase 4: 测试

#### T13: MCP服务器单元测试
**负责人**: Tester  
**工时**: 4h  
**依赖**: T12  
**状态**: ⏳

**描述**:
为MCP服务器编写单元测试。

**测试项**:
- [ ] 服务器启动测试
- [ ] 参数验证测试
- [ ] 工具注册测试
- [ ] 错误处理测试

**验收标准**:
- 测试覆盖率 > 80%
- 所有测试通过

---

#### T14: 集成测试
**负责人**: Tester  
**工时**: 4h  
**依赖**: T13  
**状态**: ⏳

**描述**:
测试完整workflow。

**测试场景**:
- [ ] spawn → write → read → kill workflow
- [ ] 多会话并发
- [ ] 错误处理场景
- [ ] 大输出处理

**验收标准**:
- 所有场景通过

---

#### T15: CC集成测试
**负责人**: Tester  
**工时**: 4h  
**依赖**: T14  
**状态**: ⏳

**描述**:
在Claude Code中测试MCP集成。

**配置**:
```json
{
  "mcpServers": {
    "claude-pty": {
      "command": "bun",
      "args": ["./mcp/src/server.ts"]
    }
  }
}
```

**验收标准**:
- Claude Code可以调用工具
- 功能正常

---

### Phase 5: 文档与发布

#### T16: 更新README文档
**负责人**: Analyst  
**工时**: 2h  
**依赖**: T15  
**状态**: ⏳

**描述**:
编写MCP相关文档。

**内容**:
- [ ] MCP安装说明
- [ ] 配置示例
- [ ] 使用指南
- [ ] 与Plugin对比

**验收标准**:
- 文档完整
- 示例可运行

---

#### T17: 创建发布包
**负责人**: Coder  
**工时**: 2h  
**依赖**: T16  
**状态**: ⏳

**描述**:
构建并发布MCP版本。

**操作**:
```bash
cd mcp
bun run build
npm publish
```

**验收标准**:
- 构建成功
- 可以安装

---

## 依赖关系图

```
T1 ──┬── T2 ── T3 ──┬── T4 ──┬── T9 ───┬── T10 ───┬── T12 ───┬── T13 ───┬── T14 ───┬── T15 ───┬── T16 ─── T17
     │              ├── T5 ──┤         ├── T11 ───┘          │          │          │          │
     │              ├── T6 ──┤         │                     │          │          │          │
     │              ├── T7 ──┤         │                     │          │          │          │
     │              └── T8 ──┘         │                     │          │          │          │
     │                                 │                     │          │          │          │
     └── (初始化完成)                   (工具迁移完成)         (核心适配完成)        (测试完成)   (文档完成)
```

---

## 风险跟踪

| 风险ID | 描述 | 等级 | 缓解措施 | 状态 |
|--------|------|------|----------|------|
| R1 | notify机制移除影响用户体验 | 高 | 使用stderr替代 | 待处理 |
| R2 | context.sessionId缺失 | 中 | 独立ID生成 | 待处理 |
| R3 | 权限系统简化 | 中 | MCP客户端控制 | 待处理 |
| R4 | Zod验证差异 | 低 | 详细测试 | 待处理 |

---

*任务清单版本: 1.0*
*创建时间: 2026-04-08*
*预计总工时: 50h*
