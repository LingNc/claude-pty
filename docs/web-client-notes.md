<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>PTY Sessions Monitor</title>
    <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        background: #0d1117;
        color: #c9d1d9;
        height: 100vh;
        display: flex;
        flex-direction: column;
      }
      #root {
        height: 100%;
      }
      .container {
        display: flex;
        height: 100%;
        overflow: hidden;
      }
      .sidebar {
        width: 300px;
        background: #161b22;
        border-right: 1px solid #30363d;
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }
      .sidebar-header {
        padding: 16px;
        border-bottom: 1px solid #30363d;
        background: #161b22;
      }
      .sidebar-header h1 {
        font-size: 18px;
        font-weight: 600;
        color: #58a6ff;
      }
      .session-list {
        flex: 1;
        overflow-y: auto;
        padding: 8px;
      }
      .session-item {
        padding: 12px;
        margin-bottom: 8px;
        background: #21262d;
        border: 1px solid #30363d;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.2s;
      }
      .session-item:hover {
        background: #30363d;
      }
      .session-item.active {
        border-color: #58a6ff;
        background: #1f6feb1a;
      }
      .session-title {
        font-weight: 通用Web界面，支持任何工具（包括Claude Code (via PTY tools)                              │
│  │ 数字员工平台                              │
├─────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ │
│  │ 开发工程师│  │ 运维工程师│  │ 数据分析师│  │  ...    │ │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬────┘ │
│       │             │             │             │      │
│       └─────────────┴─────────────┴─────────────┘      │
│                         │                               │
│                    Web界面 (T16)                         │
│                         │                               │
│              ┌──────────┴──────────┐                    │
│              │    Web服务器 (T15)    │                    │
│              │   Bun.serve + WS      │                    │
│              └──────────┬──────────┘                    │
│                         │                               │
│              ┌──────────┴──────────┐                    │
│              │    PTY核心 (T1-T14)  │                    │
│              │   manager + bun-pty   │                    │
│              └─────────────────────┘                    │
└─────────────────────────────────────────────────────────┘
```

### 价值
- **统一入口**: 所有角色共享同一Web界面
- **实时协作**: WebSocket多会话监控
- **历史追溯**: 会话列表与输出缓冲
- **权限管控**: 复用Phase 3权限系统

### 依赖
- T15 Web服务器 ✅
- T16 Web客户端 (当前)
- T17 pty-open命令

## 架构

```
Client (React + xterm.js)
    │
    ├── Components
    │   ├── App.tsx          # 主应用
    │   ├── Sidebar.tsx      # 会话列表
    │   ├── TerminalRenderer.tsx  # xterm终端
    │   └── ErrorBoundary.tsx     # 错误处理
    │
    ├── Hooks
    │   ├── useWebSocket.ts       # WS连接管理
    │   └── useSessionManager.ts  # 会话操作
    │
    └── main.tsx             # 入口

Shared
    ├── types.ts             # 类型定义
    ├── routes.ts            # 路由常量
    ├── constants.ts         # 常量
    ├── api-client.ts        # HTTP客户端
    └── route-builder.ts     # URL构建

Server (T15)
    └── Bun.serve + handlers
```

## 技术栈
- **框架**: React 18 + TypeScript
- **终端**: xterm.js + addon-fit + addon-serialize
- **通信**: WebSocket (实时) + REST API (控制)
- **构建**: Vite (推荐) 或 esbuild

## 主题
深色主题 (GitHub Dark)
- 背景: #0d1117
- 面板: #161b22
- 边框: #30363d
- 主色: #58a6ff
- 成功: #238636
- 警告: #da3633

## 文件清单
- src/web/client/main.tsx
- src/web/client/components/app.tsx
- src/web/client/components/sidebar.tsx
- src/web/client/components/terminal-renderer.tsx
- src/web/client/components/error-boundary.tsx
- src/web/client/hooks/use-web-socket.ts
- src/web/client/hooks/use-session-manager.ts
- src/web/client/index.html
- src/web/shared/api-client.ts (新增)
- src/web/shared/route-builder.ts (新增)

## 风险
- 🟡 xterm.js版本兼容性
- 🟡 WebSocket URL在代理环境
- 🟢 React版本 (Claude Code内置)
