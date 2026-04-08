# claude-pty

PTY终端集成工具 for Claude Code

支持两种方式使用：
- **Plugin模式** - 传统Claude Code插件
- **MCP模式** - Model Context Protocol服务器（推荐）

---

## 快速开始

### 方式一：MCP模式（推荐）

MCP (Model Context Protocol) 是Anthropic推出的开放协议，提供更好的工具调用体验。

#### 1. 安装

```bash
# 全局安装MCP服务器
npm install -g claude-pty-mcp

# 或使用bun
bun install -g claude-pty-mcp
```

#### 2. 配置 .mcp.json

在你的项目根目录或Claude Code配置目录创建 `.mcp.json`：

```json
{
  "mcpServers": {
    "claude-pty": {
      "command": "claude-pty-mcp",
      "env": {
        "PTY_MAX_BUFFER_SIZE": "1000000",
        "PTY_DEFAULT_COLS": "120",
        "PTY_DEFAULT_ROWS": "30"
      }
    }
  }
}
```

**使用本地开发版本：**

```json
{
  "mcpServers": {
    "claude-pty": {
      "command": "node",
      "args": ["/path/to/claude-pty/mcp/dist/server.js"],
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
```

#### 3. 重启Claude Code

配置完成后重启Claude Code，MCP工具将自动加载。

---

### 方式二：Plugin模式

#### 1. 添加插件市场

在Claude Code中运行：
```
/plugin marketplace add https://github.com/LingNc/claude-pty
```

#### 2. 安装插件
```
/plugin install claude-pty/claude-pty
```

---

## 工具使用指南

### pty_spawn - 创建PTY会话

启动一个新的伪终端会话。

**参数：**
- `command` (string, 必需) - 要执行的命令
- `args` (string[], 可选) - 命令参数
- `workdir` (string, 可选) - 工作目录
- `env` (object, 可选) - 环境变量
- `title` (string, 可选) - 会话标题
- `description` (string, 必需) - 会话描述（5-10字）
- `notifyOnExit` (boolean, 可选) - 退出时通知

**示例：**
```json
{
  "command": "npm",
  "args": ["run", "dev"],
  "description": "Start dev server",
  "notifyOnExit": true
}
```

### pty_read - 读取输出

从PTY会话读取缓冲的输出。

**参数：**
- `id` (string, 必需) - 会话ID
- `offset` (number, 可选) - 起始行号（默认0）
- `limit` (number, 可选) - 读取行数（默认500）
- `pattern` (string, 可选) - 正则过滤模式
- `ignoreCase` (boolean, 可选) - 忽略大小写

**示例：**
```json
{
  "id": "pty_abc123",
  "offset": 0,
  "limit": 100
}
```

### pty_write - 发送输入

向PTY会话发送输入。

**参数：**
- `id` (string, 必需) - 会话ID
- `data` (string, 必需) - 输入数据

**示例：**
```json
{
  "id": "pty_abc123",
  "data": "y\n"
}
```

**特殊字符：**
- `\n` - 回车
- `\u0003` - Ctrl+C
- `\u0004` - Ctrl+D

### pty_kill - 终止会话

终止PTY会话。

**参数：**
- `id` (string, 必需) - 会话ID
- `cleanup` (boolean, 可选) - 是否清理资源

**示例：**
```json
{
  "id": "pty_abc123",
  "cleanup": true
}
```

### pty_list - 列出会话

列出所有活动的PTY会话。

**参数：** 无

**返回：** 会话列表，包含id、title、status、pid等信息。

---

## 使用场景示例

### 场景1：运行开发服务器

1. 创建会话：
   ```
   pty_spawn {"command": "npm", "args": ["run", "dev"], "description": "Dev server", "notifyOnExit": true}
   ```

2. 等待启动完成，查看输出：
   ```
   pty_read {"id": "pty_xxx", "limit": 50}
   ```

3. 服务器运行中...（收到pty_exited通知时处理退出）

4. 停止服务器：
   ```
   pty_kill {"id": "pty_xxx"}
   ```

### 场景2：交互式命令

1. 启动交互式shell：
   ```
   pty_spawn {"command": "bash", "description": "Interactive shell"}
   ```

2. 发送命令：
   ```
   pty_write {"id": "pty_xxx", "data": "ls -la\n"}
   ```

3. 读取输出：
   ```
   pty_read {"id": "pty_xxx"}
   ```

4. 退出：
   ```
   pty_write {"id": "pty_xxx", "data": "exit\n"}
   ```

---

## MCP vs Plugin 对比

| 特性 | MCP模式 | Plugin模式 |
|------|---------|------------|
| **安装方式** | npm install + .mcp.json | /plugin install |
| **配置位置** | .mcp.json | 自动配置 |
| **传输协议** | stdio | 内部集成 |
| **上下文访问** | 受限 | 完整 |
| **通知机制** | stderr输出 | context.notify |
| **权限控制** | MCP客户端控制 | 内置权限系统 |
| **会话生命周期** | 进程绑定 | 会话绑定 |
| **跨平台** | ✅ 标准协议 | ⚠️ CC特定 |
| **退出通知** | stderr日志 | 系统通知 |

### 选择建议

- **使用MCP**：如果你需要标准协议、跨工具兼容、更简单的部署
- **使用Plugin**：如果你需要完整上下文、系统通知、深度集成

---

## 开发

### 构建

```bash
# Plugin版本
bun install
bun run build

# MCP版本
cd mcp
bun install
bun run build
```

### 测试

```bash
# 单元测试
bun test

# 集成测试
bun test:integration

# MCP测试
cd mcp
bun test
```

### 目录结构

```
claude-pty/
├── src/                    # Plugin源码
│   ├── tools/             # 5个PTY工具
│   ├── pty/               # PTY核心模块
│   └── index.ts           # 插件入口
├── mcp/                    # MCP服务器
│   ├── src/               # MCP源码
│   │   ├── server.ts      # 服务器入口
│   │   └── tools/         # MCP工具实现
│   └── dist/              # 构建输出
└── test/                   # 测试文件
```

---

## 配置选项

### 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `PTY_MAX_BUFFER_SIZE` | 最大缓冲区大小（字符） | 1000000 |
| `PTY_DEFAULT_COLS` | 默认终端列数 | 120 |
| `PTY_DEFAULT_ROWS` | 默认终端行数 | 30 |

---

## 故障排除

### MCP模式问题

**问题：工具未显示**
- 检查 `.mcp.json` 配置语法
- 确认 `claude-pty-mcp` 已安装且可执行
- 查看Claude Code MCP日志

**问题：进程启动失败**
- 检查命令是否存在
- 确认工作目录权限
- 查看stderr输出

### Plugin模式问题

**问题：插件未加载**
- 运行 `/reload-plugins`
- 检查插件是否启用 `/plugins`

---

## 许可证

MIT

---

## 贡献

欢迎提交PR和Issue！

开发前请阅读：
- `mcp/ARCHITECTURE.md` - MCP架构设计
- `mcp/MIGRATION_PLAN.md` - 迁移计划
- `mcp/TASKS.md` - 任务清单
