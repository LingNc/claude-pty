# claude-pty

PTY终端集成插件 for Claude Code

## 快速开始

### 1. 添加插件市场
在Claude Code中运行：
```
/plugin marketplace add github/LingNc/claude-pty
```

### 2. 安装插件
```
/plugin install claude-pty/claude-pty
```

### 3. 或使用settings.json配置
在`~/.claude/settings.json`中添加：
```json
{
  "extraKnownMarketplaces": {
    "claude-pty": {
      "source": {
        "source": "github",
        "repo": "LingNc/claude-pty"
      }
    }
  }
}
```
然后运行：`/plugin install claude-pty/claude-pty`

## 安装

通过Claude Code插件市场安装：
1. 打开Claude Code
2. 进入设置 → 插件市场
3. 添加仓库：`https://github.com/LingNc/claude-pty.git`
4. 安装插件

## 使用

安装后可用命令：
- `pty_spawn` - 创建PTY会话
- `pty_read` - 读取输出
- `pty_write` - 发送输入
- `pty_kill` - 终止会话
- `pty_list` - 列出会话
- `pty_open` - 打开Web终端（自动启动Web服务器）

## 开发

```bash
# 安装依赖
bun install

# 运行测试
bun test          # 单元测试
bun test:integration  # 集成测试
bun test:e2e      # E2E测试（需Playwright）
```

## 许可证

MIT
