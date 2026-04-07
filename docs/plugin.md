Plugins 让你能够使用自定义功能扩展 Claude Code，这些功能可以在项目和团队中共享。本指南涵盖如何使用 skills、agents、hooks 和 MCP servers 创建自己的插件。 想要安装现有插件？请参阅 [发现和安装插件](https://code.claude.com/docs/zh-CN/discover-plugins) 。有关完整的技术规范，请参阅 [插件参考](https://code.claude.com/docs/zh-CN/plugins-reference) 。

## 何时使用插件与独立配置

Claude Code 支持两种方式来添加自定义 skills、agents 和 hooks：

| 方法 | Skill 名称 | 最适合 |
| --- | --- | --- |
| **独立** （`.claude/` 目录） | `/hello` | 个人工作流、项目特定的自定义、快速实验 |
| **插件** （包含 `.claude-plugin/plugin.json` 的目录） | `/plugin-name:hello` | 与团队成员共享、分发到社区、版本化发布、跨项目重用 |

**在以下情况下使用独立配置** ：
- 你正在为单个项目自定义 Claude Code
- 配置是个人的，不需要共享
- 你在打包 skills 或 hooks 之前进行实验
- 你想要简短的 skill 名称，如 `/hello` 或 `/deploy`
**在以下情况下使用插件** ：
- 你想与团队或社区共享功能
- 你需要在多个项目中使用相同的 skills/agents
- 你想要版本控制和轻松更新扩展
- 你通过市场分发
- 你可以接受命名空间化的 skills，如 `/my-plugin:hello` （命名空间可防止插件之间的冲突）

从 `.claude/` 中的独立配置开始进行快速迭代，然后在准备好共享时 [转换为插件](#convert-existing-configurations-to-plugins) 。

## 快速开始

本快速开始将引导你创建一个带有自定义 skill 的插件。你将创建一个清单（定义插件的配置文件）、添加一个 skill，并使用 `--plugin-dir` 标志在本地测试它。

### 前置条件

- Claude Code [已安装并已认证](https://code.claude.com/docs/zh-CN/quickstart#step-1-install-claude-code)

如果你没有看到 `/plugin` 命令，请将 Claude Code 更新到最新版本。有关升级说明，请参阅 [故障排除](https://code.claude.com/docs/zh-CN/troubleshooting) 。

### 创建你的第一个插件

你已成功创建并测试了一个包含以下关键组件的插件：
- **插件清单** （`.claude-plugin/plugin.json` ）：描述你的插件的元数据
- **Skills 目录** （ `skills/` ）：包含你的自定义 skills
- **Skill 参数** （ `$ARGUMENTS` ）：捕获用户输入以实现动态行为

`--plugin-dir` 标志对开发和测试很有用。当你准备好与他人共享你的插件时，请参阅 [创建和分发插件市场](https://code.claude.com/docs/zh-CN/plugin-marketplaces) 。

## 插件结构概览

你已创建了一个带有 skill 的插件，但插件可以包含更多内容：自定义 agents、hooks、MCP servers 和 LSP servers。

**常见错误** ：不要将 `commands/` 、 `agents/` 、 `skills/` 或 `hooks/` 放在 `.claude-plugin/` 目录内。只有 `plugin.json` 应该在 `.claude-plugin/` 内。所有其他目录必须在插件根级别。

| 目录 | 位置 | 目的 |
| --- | --- | --- |
| `.claude-plugin/` | 插件根 | 包含 `plugin.json` 清单（如果组件使用默认位置，则可选） |
| `commands/` | 插件根 | 作为 Markdown 文件的 Skills |
| `agents/` | 插件根 | 自定义 agent 定义 |
| `skills/` | 插件根 | 带有 `SKILL.md` 文件的 Agent Skills |
| `hooks/` | 插件根 | `hooks.json` 中的事件处理程序 |
| `.mcp.json` | 插件根 | MCP server 配置 |
| `.lsp.json` | 插件根 | 用于代码智能的 LSP server 配置 |
| `settings.json` | 插件根 | 启用插件时应用的默认 [设置](https://code.claude.com/docs/zh-CN/settings) |

**后续步骤** ：准备好添加更多功能了吗？跳转到 [开发更复杂的插件](#develop-more-complex-plugins) 以添加 agents、hooks、MCP servers 和 LSP servers。有关所有插件组件的完整技术规范，请参阅 [插件参考](https://code.claude.com/docs/zh-CN/plugins-reference) 。

## 开发更复杂的插件

一旦你对基本插件感到满意，你可以创建更复杂的扩展。

### 向你的插件添加 Skills

插件可以包含 [Agent Skills](https://code.claude.com/docs/zh-CN/skills) 以扩展 Claude 的功能。Skills 是模型调用的：Claude 根据任务上下文自动使用它们。 在你的插件根目录添加一个 `skills/` 目录，其中包含包含 `SKILL.md` 文件的 Skill 文件夹：

```text
my-plugin/
├── .claude-plugin/
│   └── plugin.json
└── skills/
    └── code-review/
        └── SKILL.md
```

每个 `SKILL.md` 需要包含 `name` 和 `description` 字段的 frontmatter，后跟说明：

```yaml
---
name: code-review
description: Reviews code for best practices and potential issues. Use when reviewing code, checking PRs, or analyzing code quality.
---

When reviewing code, check for:
1. Code organization and structure
2. Error handling
3. Security concerns
4. Test coverage
```

安装插件后，运行 `/reload-plugins` 以加载 Skills。有关完整的 Skill 编写指南，包括渐进式披露和工具限制，请参阅 [Agent Skills](https://code.claude.com/docs/zh-CN/skills) 。

### 向你的插件添加 LSP servers

对于 TypeScript、Python 和 Rust 等常见语言，请从官方市场安装预构建的 LSP 插件。仅当你需要支持尚未涵盖的语言时，才创建自定义 LSP 插件。

LSP（Language Server Protocol）插件为 Claude 提供实时代码智能。如果你需要支持没有官方 LSP 插件的语言，你可以通过向你的插件添加 `.lsp.json` 文件来创建自己的：

```json
{
  "go": {
    "command": "gopls",
    "args": ["serve"],
    "extensionToLanguage": {
      ".go": "go"
    }
  }
}
```

安装你的插件的用户必须在其机器上安装语言服务器二进制文件。 有关完整的 LSP 配置选项，请参阅 [LSP servers](https://code.claude.com/docs/zh-CN/plugins-reference#lsp-servers) 。

### 使用你的插件提供默认设置

插件可以在插件根目录包含一个 `settings.json` 文件，以在启用插件时应用默认配置。目前仅支持 `agent` 键。 设置 `agent` 激活插件的 [自定义 agents](https://code.claude.com/docs/zh-CN/sub-agents) 之一作为主线程，应用其系统提示、工具限制和模型。这让插件在启用时通过改变 Claude Code 的默认行为方式。

```json
{
  "agent": "security-reviewer"
}
```

此示例激活在插件的 `agents/` 目录中定义的 `security-reviewer` agent。来自 `settings.json` 的设置优先于在 `plugin.json` 中声明的 `settings` 。未知键被静默忽略。

### 组织复杂的插件

对于具有许多组件的插件，按功能组织你的目录结构。有关完整的目录布局和组织模式，请参阅 [插件目录结构](https://code.claude.com/docs/zh-CN/plugins-reference#plugin-directory-structure) 。

### 在本地测试你的插件

使用 `--plugin-dir` 标志在开发期间测试插件。这会直接加载你的插件，无需安装。

```shellscript
claude --plugin-dir ./my-plugin
```

当 `--plugin-dir` 插件与已安装的市场插件同名时，本地副本在该会话中优先。这让你可以测试已安装的插件的更改，而无需先卸载它。由托管设置强制启用的市场插件是唯一的例外，无法被覆盖。 当你对插件进行更改时，运行 `/reload-plugins` 以获取更新，无需重新启动。这会重新加载 plugins、skills、agents、hooks、插件 MCP servers 和插件 LSP servers。测试你的插件组件：
- 使用 `/plugin-name:skill-name` 尝试你的 skills
- 检查 agents 是否出现在 `/agents` 中
- 验证 hooks 是否按预期工作
你可以通过多次指定标志来一次加载多个插件：

```shellscript
claude --plugin-dir ./plugin-one --plugin-dir ./plugin-two
```

### 调试插件问题

如果你的插件不按预期工作：
1. **检查结构** ：确保你的目录在插件根目录，而不是在 `.claude-plugin/` 内
2. **单独测试组件** ：分别检查每个命令、agent 和 hook
3. **使用验证和调试工具** ：有关 CLI 命令和故障排除技术，请参阅 [调试和开发工具](https://code.claude.com/docs/zh-CN/plugins-reference#debugging-and-development-tools)

### 共享你的插件

当你的插件准备好共享时：
1. **添加文档** ：包含一个 `README.md` ，其中包含安装和使用说明
2. **版本化你的插件** ：在你的 `plugin.json` 中使用 [语义版本控制](https://code.claude.com/docs/zh-CN/plugins-reference#version-management)
3. **创建或使用市场** ：通过 [插件市场](https://code.claude.com/docs/zh-CN/plugin-marketplaces) 分发以供安装
4. **与他人测试** ：在更广泛分发之前让团队成员测试插件
一旦你的插件在市场中，其他人可以使用 [发现和安装插件](https://code.claude.com/docs/zh-CN/discover-plugins) 中的说明安装它。

### 向官方市场提交你的插件

要向官方 Anthropic 市场提交插件，请使用以下应用内提交表单之一：
- **Claude.ai** ： [claude.ai/settings/plugins/submit](https://claude.ai/settings/plugins/submit)
- **Console** ： [platform.claude.com/plugins/submit](https://platform.claude.com/plugins/submit)

有关完整的技术规范、调试技术和分发策略，请参阅 [插件参考](https://code.claude.com/docs/zh-CN/plugins-reference) 。

## 将现有配置转换为插件

如果你已经在 `.claude/` 目录中有 skills 或 hooks，你可以将它们转换为插件，以便更轻松地共享和分发。

### 迁移步骤

### 迁移时的变化

| 独立（`.claude/` ） | 插件 |
| --- | --- |
| 仅在一个项目中可用 | 可以通过市场共享 |
| `.claude/commands/` 中的文件 | `plugin-name/commands/` 中的文件 |
| `settings.json` 中的 Hooks | `hooks/hooks.json` 中的 Hooks |
| 必须手动复制以共享 | 使用 `/plugin install` 安装 |

迁移后，你可以从 `.claude/` 中删除原始文件以避免重复。加载时插件版本将优先。

## 后续步骤

现在你了解了 Claude Code 的插件系统，以下是针对不同目标的建议路径：

### 对于插件用户

- [发现和安装插件](https://code.claude.com/docs/zh-CN/discover-plugins) ：浏览市场并安装插件
- [配置团队市场](https://code.claude.com/docs/zh-CN/discover-plugins#configure-team-marketplaces) ：为你的团队设置存储库级别的插件

### 对于插件开发者

- [创建和分发市场](https://code.claude.com/docs/zh-CN/plugin-marketplaces) ：打包和共享你的插件
- [插件参考](https://code.claude.com/docs/zh-CN/plugins-reference) ：完整的技术规范
- 深入了解特定的插件组件：
	- [Skills](https://code.claude.com/docs/zh-CN/skills) ：skill 开发详情
		- [Subagents](https://code.claude.com/docs/zh-CN/sub-agents) ：agent 配置和功能
		- [Hooks](https://code.claude.com/docs/zh-CN/hooks) ：事件处理和自动化
		- [MCP](https://code.claude.com/docs/zh-CN/mcp) ：外部工具集成