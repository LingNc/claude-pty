# 插件 + MCP 整合方案

## 目标
让用户只需安装claude-pty插件，自动配置MCP服务器，无需手动操作。

## 当前问题
1. 用户需要分别安装插件和配置MCP
2. MCP服务器路径需要手动设置
3. 两个系统独立运行，体验割裂

## 设计方案

### 方案A: 插件内嵌MCP (推荐)

```
用户安装 claude-pty 插件
        ↓
插件自动启动 MCP 服务器子进程
        ↓
通过插件API注册MCP服务器到Claude Code
```

**实现步骤:**
1. 修改 `src/index.ts` 添加 MCP 启动逻辑
2. 使用 `child_process.spawn` 启动 `./mcp/dist/server.js`
3. 通过 Claude Code 内部 API 注册 MCP 服务器

**代码示例:**
```typescript
// src/index.ts
import { spawn } from 'child_process';
import { definePlugin } from 'claude-code/plugin';

export default definePlugin({
  name: 'claude-pty',
  async onLoad(context) {
    // 启动MCP服务器
    const mcpProcess = spawn('node', [require.resolve('../mcp/dist/server.js')], {
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    // 注册到Claude Code (假设API存在)
    context.registerMCPServer({
      name: 'claude-pty-mcp',
      process: mcpProcess
    });
  }
});
```

**优点:**
- 用户体验无缝
- 插件控制MCP生命周期
- 错误处理统一

**缺点:**
- 需要Claude Code支持MCP注册API
- 进程管理复杂

---

### 方案B: MCP自动配置生成

```
用户安装 claude-pty 插件
        ↓
插件生成MCP配置文件到 ~/.claude/mcp.json
        ↓
Claude Code自动加载配置
```

**实现步骤:**
1. 插件安装后钩子写入MCP配置
2. 生成 `~/.claude/mcp.json` 或类似路径
3. 配置指向插件内置的MCP服务器

**配置示例:**
```json
{
  "mcpServers": {
    "claude-pty": {
      "command": "node",
      "args": ["/path/to/plugin/mcp/dist/server.js"]
    }
  }
}
```

**优点:**
- 符合MCP标准配置方式
- 无需修改Claude Code

**缺点:**
- 需要用户重启Claude Code
- 配置路径可能因系统而异

---

### 方案C: Hybrid混合模式

结合方案A和B，优先使用API注册，降级到配置文件。

```typescript
// src/index.ts
async onLoad(context) {
  // 尝试API注册
  if (context.registerMCPServer) {
    // 方案A: 直接注册
  } else {
    // 方案B: 生成配置文件
    await generateMCPConfig();
    context.notify('请重启Claude Code以激活MCP功能');
  }
}
```

---

## 技术实现细节

### 1. 插件入口修改

```typescript
// src/index.ts
import { definePlugin } from 'claude-code/plugin';
import { spawn } from 'child_process';
import { resolve } from 'path';

export default definePlugin({
  name: 'claude-pty',
  version: '0.4.0',
  
  async onLoad(context) {
    // 获取MCP服务器路径
    const mcpPath = resolve(__dirname, '../mcp/dist/server.js');
    
    // 启动MCP服务器
    const mcpServer = spawn('node', [mcpPath], {
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    // 错误处理
    mcpServer.stderr.on('data', (data) => {
      console.error('[MCP]', data.toString());
    });
    
    // 注册到上下文
    context.mcpServers = context.mcpServers || {};
    context.mcpServers['claude-pty'] = mcpServer;
    
    // 清理
    context.onUnload = () => {
      mcpServer.kill();
    };
  },
  
  // ... 其他插件功能
});
```

### 2. 包结构

```
claude-pty/
├── src/
│   └── index.ts          # 插件入口，启动MCP
├── mcp/
│   ├── dist/
│   │   └── server.js     # MCP服务器
│   └── docs/
├── dist/                 # 插件编译输出
└── package.json
```

### 3. package.json 更新

```json
{
  "name": "claude-pty",
  "version": "0.4.0",
  "main": "./dist/index.js",
  "exports": {
    ".": "./dist/index.js",
    "./mcp": "./mcp/dist/server.js"
  },
  "scripts": {
    "build": "tsc && cd mcp && npm run build",
    "dev": "tsc --watch"
  }
}
```

---

## 参考实现

### context7 插件模式

context7插件采用类似方案：
1. 插件内嵌MCP服务器
2. 自动管理生命周期
3. 用户感知不到MCP存在

```typescript
// 伪代码参考
export default definePlugin({
  async onLoad(ctx) {
    // 启动内置MCP
    this.mcp = await startMCPServer({
      tools: [searchTool, fetchTool]
    });
    
    // 暴露到Claude Code
    ctx.mcp.register(this.mcp);
  }
});
```

---

## 实施计划

### Phase 1: 基础改造 (2天)
- [ ] 修改 `src/index.ts` 添加MCP启动逻辑
- [ ] 更新 `package.json` 构建脚本
- [ ] 测试插件+MCP同时运行

### Phase 2: 配置集成 (2天)
- [ ] 实现配置文件生成逻辑
- [ ] 添加安装后钩子
- [ ] 文档更新

### Phase 3: 优化体验 (1天)
- [ ] 错误处理和日志
- [ ] 进程保活机制
- [ ] 用户提示优化

---

## 风险评估

| 风险 | 等级 | 缓解措施 |
|------|------|----------|
| Claude Code不支持MCP注册API | 高 | 使用配置文件降级方案 |
| MCP进程崩溃 | 中 | 添加自动重启机制 |
| 路径解析问题 | 低 | 使用绝对路径和resolve |
| 版本兼容性 | 中 | 测试多版本CC |

---

## 结论

推荐采用**方案C: Hybrid混合模式**
- 主路径: API注册（最佳体验）
- 降级路径: 配置文件（兼容性）
- 用户体验: 安装即用
