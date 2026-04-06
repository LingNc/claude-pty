# AGENTS.md - claude-pty 团队全局记忆

## 1. 项目概述
- **项目名称**: claude-pty
- **核心目标**: 将 temp/opencode-pty 的插件功能迁移至 claude-code，作为可独立运行的插件，深度适配 claude-code 的 PTY 能力，使用 bun-pty
- **仓库地址**: https://github.com/LingNc/claude-pty.git

## 2. 团队成员
| 角色 | 职责 | 状态 |
|------|------|------|
| Leader | 全局统筹、进度跟踪、任务分配、最终决策 | 就绪 |
| Coder | 核心代码迁移、PTY功能适配、插件封装 | Phase 3工作中 |
| Reviewer | 代码审计、验证一致性、检查patch | Phase 2通过 |
| Tester | 环境测试、功能验证、仓库同步管理 | 就绪 |

## 3. Git规范
- 提交信息必须简短精准，示例: `feat: 适配claude-code终端信号流`
- **严禁**附带 Co-authored-by 或任何作者署名元数据
- 分支策略:
  - `main`: 稳定发布分支，仅含核心代码，不含docs/和AGENTS.md
  - `dev`: 开发分支，所有代码、文档、团队状态在此进行
  - `feat/pty-<模块名>`: 特性分支
  - `fix/pty-<问题简述>`: 修复分支

## 4. 协作规则
1. 工作流程: Leader分配 -> Analyst分析 -> Coder编码 -> Reviewer审计 -> Tester测试
2. 发现问题立即记录至AGENTS.md并同步Leader
3. 关键决策需暂停等待Leader指令
4. 成员不可越权操作，不可完成非自己的任务
5. 任务繁重可向Leader申请拆分或使用subagent（每个成员≤2个）

## 5. 项目状态
- **当前阶段**: Phase 3 完成
- **Phase 3状态**: 已完成（T12-T14全部实现）
- **Phase 2状态**: 通过（所有核心工具已实现）
- **Phase 1状态**: 通过（基础架构完成）

### 5.1 分析摘要
- **总文件数**: 36个源文件
- **可复用代码**: ~70% (buffer, output-manager, web/*, utils, formatters)
- **需重写代码**: ~30% (工具定义、权限系统、插件入口)

### 5.2 关键发现
1. bun-pty 依赖可用，无需替换
2. Web 界面可完整迁移（100%复用）
3. 工具定义 API 差异大（OpenCode vs Claude Code）
4. 权限系统需重新设计

## 6. 风险点

### 🔴 高风险
1. **API 兼容性**: OpenCode与Claude Code插件API差异大，需重写工具定义层
2. **bun-pty monkey-patch**: 原代码有竞态条件修复patch，需验证新版本是否仍需
3. **会话生命周期**: session.deleted事件处理机制差异，需确保正确清理

### 🟡 中风险
4. **权限集成**: OpenCode权限配置需映射到Claude Code settings机制
5. **通知机制**: `promptAsync` vs `notify()` API差异需适配
6. **端口冲突**: Web服务器动态端口需验证在CC环境正常工作

### 🟢 低风险
7. **配置迁移**: PTY_MAX_BUFFER_SIZE从环境变量改为settings
8. **类型调整**: 部分类型定义需适配新API

## 7. 关键路径
1. ✅ 分析opencode-pty源码架构
2. ✅ 识别需要迁移的模块和功能
3. ⏳ 创建插件脚手架（Coder待执行）
4. ⏳ 迁移核心PTY模块（buffer/lifecycle/output）
5. ⏳ 实现5个PTY工具（spawn/read/write/kill/list）
6. ⏳ 实现权限系统适配
7. ⏳ 实现插件入口和生命周期
8. ⏳ 迁移Web界面（可选）
9. ⏳ 编写测试（单元+集成）
10. ⏳ 验证发布

## 8. 参考资源
- 源项目: temp/opencode-pty/
- 分析报告: docs/migration-analysis.md
- 官网文档: https://code.claude.com/docs/zh-CN/plugin-marketplaces

## 9. 任务清单

### Phase 1: 基础架构
- [x] T1: 创建插件脚手架
- [x] T2: 迁移类型定义
- [x] T3: 迁移 RingBuffer
- [x] T4: 迁移 OutputManager
- [x] T5: 迁移 SessionLifecycle

### Phase 2: 核心工具
- [x] T6: 实现 pty_spawn
- [x] T7: 实现 pty_read
- [x] T8: 实现 pty_write
- [x] T9: 实现 pty_kill
- [x] T10: 实现 pty_list
- [x] T11: 实现权限系统

### Phase 3: 集成
- [x] T12: 插件入口
- [x] T13: 退出通知
- [x] T14: 会话清理

### Phase 4: Web界面（可选）
- [ ] T15: Web服务器
- [ ] T16: Web客户端
- [ ] T17: pty-open命令

### Phase 5: 测试
- [ ] T18: 单元测试
- [ ] T19: 集成测试
- [ ] T20: E2E测试
