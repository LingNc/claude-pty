# Claude-PTY 迁移影响分析报告

**分析时间**: 2026/04/06
**分析师**: Analyst Agent
**源项目**: opencode-pty v0.3.2
**目标平台**: Claude Code Plugin

---

## 1. 架构概览

### 1.1 模块结构

```
opencode-pty/
├── src/plugin/              # 核心插件逻辑
│   ├── pty/
│   │   ├── manager.ts       # PTY管理器（入口）
│   │   ├── session-lifecycle.ts  # 会话生命周期管理
│   │   ├── buffer.ts        # 环形缓冲区实现
│   │   ├── output-manager.ts # 输出管理
│   │   ├── notification-manager.ts # 退出通知
│   │   ├── permissions.ts   # 权限检查
│   │   ├── formatters.ts    # 输出格式化
│   │   ├── utils.ts         # 工具函数
│   │   ├── wildcard.ts      # 通配符匹配
│   │   ├── types.ts         # 类型定义
│   │   └── tools/           # 工具实现
│   │       ├── spawn.ts     # pty_spawn 工具
│   │       ├── read.ts      # pty_read 工具
│   │       ├── write.ts     # pty_write 工具
│   │       ├── kill.ts      # pty_kill 工具
│   │       └── list.ts      # pty_list 工具
│   ├── types.ts             # 插件类型定义
│   └── constants.ts         # 插件常量
├── src/web/                 # Web界面
│   ├── server/              # Web服务器
│   │   ├── server.ts        # Bun HTTP服务器
│   │   ├── callback-manager.ts # 回调管理
│   │   └── handlers/        # 请求处理器
│   ├── client/              # React前端
│   │   ├── components/      # UI组件
│   │   └── hooks/           # React Hooks
│   └── shared/              # 共享类型和API
├── src/shared/              # 全局共享常量
└── plugin.ts                # 插件入口
```

### 1.2 模块职责说明

| 模块 | 职责 | 依赖 |
|------|------|------|
| `plugin.ts` | 插件入口，注册工具、命令、事件 | @opencode-ai/plugin |
| `manager.ts` | PTY核心管理，协调各子模块 | bun-pty, lifecycle, output, notification |
| `session-lifecycle.ts` | 会话创建、销毁、事件绑定 | bun-pty |
| `buffer.ts` | 输出缓冲区，支持搜索/分页 | 无 |
| `tools/*.ts` | 5个工具实现（spawn/read/write/kill/list） | manager, permissions |
| `permissions.ts` | 命令/目录权限检查 | @opencode-ai/sdk |
| `notification-manager.ts` | 进程退出时发送通知 | @opencode-ai/sdk |
| `web/server` | Web界面HTTP/WebSocket服务 | Bun原生API |

---

## 2. 数据流图

### 2.1 PTY 核心数据流

```
┌─────────────────────────────────────────────────────────────────┐
│                         Claude Code                              │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌────────┐ │
│  │pty_spawn│  │pty_read │  │pty_write│  │pty_kill │  │pty_list│ │
│  └────┬────┘  └────▲────┘  └────┬────┘  └────┬────┘  └───┬────┘ │
│       │            │            │            │           │      │
└───────┼────────────┼────────────┼────────────┼───────────┼──────┘
        │            │            │            │           │
        ▼            │            ▼            ▼           │
┌───────────────────┴──────────────────────────────────────┴──────┐
│                      PTYManager (manager.ts)                     │
│  ┌─────────────────┐  ┌──────────────┐  ┌─────────────────────┐ │
│  │SessionLifecycle │  │ OutputManager│  │NotificationManager  │ │
│  │   (生命周期)     │  │  (输出管理)   │  │   (退出通知)         │ │
│  └────────┬────────┘  └──────┬───────┘  └──────────┬──────────┘ │
│           │                  │                     │            │
└───────────┼──────────────────┼─────────────────────┼────────────┘
            │                  │                     │
            ▼                  ▼                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                         bun-pty                                  │
│                    (PTY 底层实现)                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Web 界面数据流

```
┌─────────────┐      WebSocket       ┌─────────────┐
│  React Client│◄────────────────────►│  Bun Server │
│  (Terminal)  │   HTTP API (/api/*)  │   (routes)  │
└─────────────┘                      └──────┬──────┘
                                            │
                              ┌─────────────┼─────────────┐
                              ▼             ▼             ▼
                         ┌────────┐   ┌──────────┐   ┌──────────┐
                         │Sessions│   │Callbacks │   │ WebSocket│
                         │Handlers│   │ Manager  │   │ Handler  │
                         └───┬────┘   └────┬─────┘   └────┬─────┘
                             │             │              │
                             └─────────────┴──────────────┘
                                           │
                                           ▼
                                    ┌─────────────┐
                                    │  PTYManager │
                                    │  (manager)  │
                                    └─────────────┘
```

---

## 3. 迁移影响分析

### 3.1 平台差异对比

| 功能 | OpenCode Plugin API | Claude Code Plugin API | 影响级别 |
|------|--------------------|------------------------|----------|
| 工具定义 | `@opencode-ai/plugin` `tool()` | `defineTool()` | 🔴 高 |
| 工具Schema | `tool.schema.*()` | Zod schema | 🔴 高 |
| 客户端访问 | `PluginContext.client` | `this.context` / 参数注入 | 🔴 高 |
| 配置系统 | `client.config.get()` | `defineSettings()` | 🟡 中 |
| 会话ID | `ctx.sessionID` | `this.context.sessionId` | 🟡 中 |
| 事件监听 | `event: async ({event})` | `onSessionDeleted` hook | 🟡 中 |
| 命令注册 | `command.execute.before` | `defineCommand()` | 🟡 中 |
| 通知发送 | `client.session.promptAsync()` | `this.context.notify()` | 🟡 中 |

### 3.2 可复用组件（无需修改）

| 文件 | 说明 | 复用度 |
|------|------|--------|
| `src/plugin/pty/buffer.ts` | RingBuffer 纯逻辑实现 | 100% |
| `src/plugin/pty/output-manager.ts` | 输出管理逻辑 | 100% |
| `src/plugin/pty/formatters.ts` | 格式化函数 | 100% |
| `src/plugin/pty/utils.ts` | 工具函数 | 100% |
| `src/plugin/pty/wildcard.ts` | 通配符匹配 | 100% |
| `src/plugin/pty/session-lifecycle.ts` | 生命周期（仅类型调整）| 95% |
| `src/plugin/pty/types.ts` | 类型定义（部分调整）| 90% |
| `src/plugin/constants.ts` | 常量定义 | 100% |
| `src/shared/constants.ts` | 共享常量 | 100% |
| `src/web/**/*` | Web服务器和客户端 | 100% |

### 3.3 需要修改的核心部分

| 文件 | 修改内容 | 工作量 | 风险 |
|------|----------|--------|------|
| `plugin.ts` | 插件入口重写，适配CC API | 2-3h | 🔴 高 |
| `src/plugin/pty/manager.ts` | 移除monkey-patch，调整回调 | 1-2h | 🟡 中 |
| `src/plugin/pty/tools/*.ts` | 5个工具适配新API | 3-4h | 🟡 中 |
| `src/plugin/pty/permissions.ts` | 权限系统重写 | 2-3h | 🟡 中 |
| `src/plugin/pty/notification-manager.ts` | 通知API适配 | 1h | 🟢 低 |

---

## 4. 任务拆解清单

### Phase 1: 基础架构迁移（高优先级）

| 任务ID | 任务描述 | 预估工时 | 风险 | 依赖 |
|--------|----------|----------|------|------|
| T1 | 创建 claude-pty 插件脚手架 | 1h | 🟢 低 | 无 |
| T2 | 迁移类型定义（types.ts） | 1h | 🟢 低 | T1 |
| T3 | 迁移 RingBuffer（buffer.ts） | 0.5h | 🟢 低 | T1 |
| T4 | 迁移 OutputManager | 0.5h | 🟢 低 | T3 |
| T5 | 迁移 SessionLifecycle | 1h | 🟡 中 | T1 |

### Phase 2: 核心工具迁移（高优先级）

| 任务ID | 任务描述 | 预估工时 | 风险 | 依赖 |
|--------|----------|----------|------|------|
| T6 | 实现 pty_spawn 工具 | 2h | 🔴 高 | T2-T5 |
| T7 | 实现 pty_read 工具 | 1.5h | 🟡 中 | T6 |
| T8 | 实现 pty_write 工具 | 1h | 🟡 中 | T6 |
| T9 | 实现 pty_kill 工具 | 0.5h | 🟢 低 | T6 |
| T10 | 实现 pty_list 工具 | 0.5h | 🟢 低 | T6 |
| T11 | 迁移权限检查系统 | 2h | 🟡 中 | T6-T10 |

### Phase 3: 插件集成（中优先级）

| 任务ID | 任务描述 | 预估工时 | 风险 | 依赖 |
|--------|----------|----------|------|------|
| T12 | 实现插件入口（plugin.ts） | 2h | 🔴 高 | T6-T11 |
| T13 | 实现退出通知 | 1h | 🟢 低 | T12 |
| T14 | 实现会话清理钩子 | 1h | 🟢 低 | T12 |

### Phase 4: Web界面（低优先级）

| 任务ID | 任务描述 | 预估工时 | 风险 | 依赖 |
|--------|----------|----------|------|------|
| T15 | 迁移 Web 服务器 | 1h | 🟢 低 | T12 |
| T16 | 迁移 Web 客户端 | 1h | 🟢 低 | T15 |
| T17 | 实现 pty-open 命令 | 0.5h | 🟢 低 | T15 |

### Phase 5: 测试与验证（必须）

| 任务ID | 任务描述 | 预估工时 | 风险 | 依赖 |
|--------|----------|----------|------|------|
| T18 | 编写工具单元测试 | 3h | 🟡 中 | T6-T11 |
| T19 | 集成测试（PTY流程） | 2h | 🟡 中 | T18 |
| T20 | Web界面E2E测试 | 2h | 🟡 中 | T16 |

---

## 5. 风险点分析

### 🔴 高风险

1. **API 兼容性差异**
   - OpenCode 和 Claude Code 的插件API有本质差异
   - 工具定义方式完全不同（需要重写）
   - 缓解：参考官方文档，小步验证

2. **bun-pty monkey-patch**
   - 原代码对 bun-pty 有 monkey-patch 处理竞态条件
   - 需要确认在新版本 bun-pty 是否仍需此patch
   - 缓解：测试无patch情况下稳定性

3. **会话生命周期管理**
   - session.deleted 事件处理机制差异
   - 需要确保会话正确清理
   - 缓解：增加集成测试覆盖

### 🟡 中风险

4. **权限系统集成**
   - OpenCode 的权限配置需要映射到 Claude Code
   - 可能需要重新设计权限配置方式
   - 缓解：使用插件 settings 机制

5. **通知机制差异**
   - `session.promptAsync` vs `notify()` API差异
   - 需要调整通知格式和内容
   - 缓解：封装通知层

6. **Web服务器端口冲突**
   - 原代码使用动态端口（port: 0）
   - 需要确保在CC环境中正常工作
   - 缓解：可配置端口范围

### 🟢 低风险

7. **缓冲区大小配置**
   - 环境变量 PTY_MAX_BUFFER_SIZE 需改为 settings
8. **类型定义调整**
   - 部分类型需要适配新API
9. **常量位置调整**
   - shared/constants 可能需要合并

---

## 6. 依赖分析

### 必须依赖

| 包名 | 版本 | 用途 | 状态 |
|------|------|------|------|
| bun-pty | ^0.4.8 | PTY核心实现 | ✅ 可用 |
| @anthropic-ai/claude-code | * | Claude Code SDK | ✅ 目标平台 |

### 开发依赖

| 包名 | 版本 | 用途 | 状态 |
|------|------|------|------|
| typescript | ^5.x | 类型检查 | ✅ 可用 |
| @types/bun | ^1.x | Bun类型 | ✅ 可用 |

### 移除依赖

| 包名 | 原因 |
|------|------|
| @opencode-ai/plugin | 替换为 Claude Code SDK |
| @opencode-ai/sdk | 替换为 Claude Code SDK |

---

## 7. 建议实施顺序

```
Week 1: Phase 1 + Phase 2 (核心工具)
  - T1 -> T3 -> T4 -> T5 -> T6 -> T8 -> T9 -> T10

Week 2: Phase 2 (完成) + Phase 3
  - T7 -> T11 -> T12 -> T13 -> T14

Week 3: Phase 4 + Phase 5 (测试)
  - T15 -> T16 -> T17 -> T18 -> T19 -> T20
```

---

**报告完成** | 分析师: Analyst Agent | 2026/04/06
