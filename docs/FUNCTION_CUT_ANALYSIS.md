# 插件功能裁剪分析报告

## 1. 功能对比总览

### 1.1 架构对比

| 特性 | Plugin模式 | MCP模式 | 建议 |
|------|-----------|---------|------|
| **核心工具** | 5个PTY工具 | 5个PTY工具 | ✅ **保留双模式** |
| **Web界面** | Bun.serve + React | ❌ 不支持 | ⚠️ **Plugin独有** |
| **权限系统** | 完整权限检查 | 简化/移除 | ⚠️ **依赖客户端** |
| **Settings** | defineSetting | 环境变量 | ⚠️ **配置方式不同** |
| **Commands** | defineCommand | ❌ 不支持 | ⚠️ **Plugin独有** |
| **生命周期钩子** | onSessionDeleted | 进程级 | ⚠️ **行为差异** |
| **安装方式** | /plugin install | npm + .mcp.json | ✅ **两种并存** |

---

## 2. 插件独有功能（需保留或替代）

### 2.1 Web界面（高价值）

**功能描述**：
- `/pty-open` 命令启动Web服务器
- React + xterm.js终端渲染
- 实时WebSocket通信
- 会话可视化

**MCP限制**：
- MCP协议不支持HTTP服务器
- 无法提供Web界面

**决策**：✅ **保留在Plugin中**
- 用户可通过Plugin获得Web界面
- MCP用户需使用纯命令行交互

### 2.2 Commands（/pty-open, /pty-show-url）

**功能描述**：
- `/pty-open` - 启动Web UI
- `/pty-show-url` - 显示Web URL

**MCP限制**：
- MCP不支持自定义commands
- 仅支持tools

**决策**：✅ **保留在Plugin中**
- 作为Web界面的配套命令

### 2.3 完整权限系统

**功能描述**（src/permissions.ts）：
```typescript
- checkCommandPermission()  // 命令白名单/黑名单
- checkWorkdirPermission()  // 工作目录限制
- 支持 allow/ask/deny 三级权限
```

**MCP限制**：
- MCP工具由客户端控制权限
- 服务器端权限检查有限

**决策**：⚠️ **简化后保留**
- 保留基础安全检查（命令注入防护）
- 移除复杂权限配置
- 依赖MCP客户端权限控制

### 2.4 Settings配置系统

**功能描述**（src/index.ts）：
```typescript
defineSetting({ key: 'pty.maxBufferSize', type: 'number', default: 1000000 })
defineSetting({ key: 'pty.defaultCols', type: 'number', default: 120 })
defineSetting({ key: 'pty.defaultRows', type: 'number', default: 30 })
```

**MCP替代方案**：
- 环境变量：`PTY_MAX_BUFFER_SIZE`
- 启动参数

**决策**：⚠️ **双模式支持**
- Plugin：使用defineSetting
- MCP：使用环境变量

### 2.5 onSessionDeleted钩子

**功能描述**：
```typescript
onSessionDeleted({ sessionId }) {
  manager.cleanupBySession(sessionId)
}
```

**功能**：Claude Code会话删除时自动清理PTY子会话

**MCP限制**：
- MCP服务器运行在独立进程
- 无Claude Code会话概念
- 生命周期绑定进程而非会话

**决策**：⚠️ **MCP需手动清理**
- Plugin：自动清理（推荐）
- MCP：用户需手动调用pty_kill
- 文档中明确说明差异

---

## 3. 建议的插件精简架构

### 3.1 双模式架构设计

```
claude-pty/
├── src/                    # Plugin模式（精简版）
│   ├── index.ts           # 插件入口
│   ├── tools/             # 5个PTY工具（复用核心）
│   ├── commands/          # Web界面命令（Plugin独有）
│   ├── web/               # Web界面（Plugin独有）
│   └── permissions.ts     # 简化权限
├── mcp/                    # MCP模式
│   ├── src/               # MCP服务器
│   │   ├── server.ts      # 入口
│   │   └── tools/         # 5个PTY工具（相同实现）
│   └── ...
└── shared/                 # 共享核心（复用）
    └── pty/               # PTY核心模块
```

### 3.2 Plugin版本功能清单

| 功能 | 状态 | 说明 |
|------|------|------|
| pty_spawn | ✅ 保留 | 创建PTY会话 |
| pty_read | ✅ 保留 | 读取输出 |
| pty_write | ✅ 保留 | 发送输入 |
| pty_kill | ✅ 保留 | 终止会话 |
| pty_list | ✅ 保留 | 列出会话 |
| Web界面 | ✅ 保留 | Plugin独有优势 |
| /pty-open | ✅ 保留 | 启动Web UI |
| /pty-show-url | ✅ 保留 | 显示URL |
| 权限系统 | ⚠️ 简化 | 保留基础检查 |
| Settings | ✅ 保留 | CC配置方式 |
| onSessionDeleted | ✅ 保留 | 自动清理 |

### 3.3 MCP版本功能清单

| 功能 | 状态 | 说明 |
|------|------|------|
| pty_spawn | ✅ 支持 | 创建PTY会话 |
| pty_read | ✅ 支持 | 读取输出 |
| pty_write | ✅ 支持 | 发送输入 |
| pty_kill | ✅ 支持 | 终止会话 |
| pty_list | ✅ 支持 | 列出会话 |
| Web界面 | ❌ 不支持 | 协议限制 |
| /pty-open | ❌ 不支持 | 协议限制 |
| 权限系统 | ⚠️ 简化 | 基础检查 |
| Settings | ⚠️ 环境变量 | 不同配置方式 |
| 自动清理 | ❌ 不支持 | 需手动kill |

---

## 4. 裁剪建议

### 4.1 从Plugin中删除的功能

❌ **无主要功能需删除**

Plugin应保持完整功能，作为MCP的增强版。

### 4.2 Plugin中简化的功能

⚠️ **权限系统简化**：
```typescript
// 当前：复杂权限配置
export async function checkCommandPermission(command: string, args: string[]): Promise<void> {
  // 支持 allow/ask/deny
  // 支持通配符匹配
  // 支持多级配置
}

// 建议：基础安全检查
export async function checkCommandPermission(command: string): Promise<void> {
  // 仅检查命令注入
  // 基础白名单
}
```

### 4.3 代码复用策略

**高复用率**：
```
src/pty/                  # 100%复用
├── manager.ts           # PTY管理核心
├── session-lifecycle.ts # 生命周期
├── output-manager.ts    # 输出管理
├── buffer.ts           # RingBuffer
└── types.ts            # 类型定义

src/tools/*.ts           # 80%复用（仅需适配API）
```

**Plugin独有**：
```
src/web/                 # 不迁移到MCP
src/commands/            # 不迁移到MCP
src/permissions.ts       # 简化版共享
```

---

## 5. 用户使用建议

### 5.1 选择指南

| 场景 | 推荐方式 | 理由 |
|------|----------|------|
| 需要Web界面 | **Plugin** | Web UI可视化 |
| 纯命令行使用 | **MCP** | 标准协议，跨工具 |
| 团队协作 | **MCP** | 配置标准化 |
| 快速试用 | **Plugin** | 一键安装 |
| CI/CD集成 | **MCP** | 环境变量配置 |

### 5.2 功能差异说明

**MCP用户须知**：
1. ❌ 无Web界面 - 使用命令行工具交互
2. ❌ 无自动清理 - 需手动调用pty_kill
3. ⚠️ 配置方式不同 - 使用环境变量而非Settings
4. ⚠️ 权限依赖客户端 - 需配置MCP客户端权限

**Plugin用户优势**：
1. ✅ 完整的Web界面
2. ✅ 自动会话清理
3. ✅ 内置权限系统
4. ✅ 集成Settings配置

---

## 6. 实施建议

### 6.1 保留双模式

不要完全迁移到MCP，而是**双模式并存**：
- **MCP模式**：标准协议，跨平台兼容
- **Plugin模式**：增强功能，Web界面

### 6.2 文档策略

1. **README.md**：双模式对比，选择指南
2. **docs/MCP.md**：MCP专属文档
3. **docs/PLUGIN.md**：Plugin专属文档

### 6.3 发布策略

- `claude-pty` - Plugin包（完整功能）
- `claude-pty-mcp` - MCP包（精简功能）

---

## 7. 总结

### 无需删除的功能

Plugin版本**不应删除任何功能**，而是作为MCP的增强版存在。

### 需要简化的功能

1. **权限系统** - 从复杂配置简化为基础检查
2. **文档说明** - 明确MCP不支持的功能

### 核心价值

- **MCP**：标准协议，工具互操作性
- **Plugin**：完整体验，Web界面增强

**最终建议**：双模式并存，让用户根据需求选择。
