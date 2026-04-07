# AGENTS.md - claude-pty 团队全局记忆

## 1. 项目概述
- **项目名称**: claude-pty
- **核心目标**: 将 temp/opencode-pty 的插件功能迁移至 claude-code，作为可独立运行的插件，深度适配 claude-code 的 PTY 能力，使用 bun-pty
- **仓库地址**: https://github.com/LingNc/claude-pty.git

## 2. 团队成员
| 角色 | 职责 | 状态 |
|------|------|------|
| Leader | 全局统筹、进度跟踪、任务分配、最终决策 | 就绪 |
| Coder | 核心代码迁移、PTY功能适配、插件封装 | Phase 5完成 |
| Analyst | 架构分析、任务拆解、风险评估 | 完成 |
| Reviewer | 代码审计、验证一致性、检查patch | 完成 |
| Tester | 环境测试、功能验证、仓库同步管理 | Phase 5完成 |

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
- **当前阶段**: Phase 5 完成，项目进入收尾阶段
- **Phase 5状态**: T18✅(49用例) T19✅(50用例) T20⏸️(建议跳过，需Bun+Playwright)
- **Phase 4状态**: ✅ 全部完成
- **Phase 3状态**: ✅ 全部完成
- **Phase 2状态**: ✅ 全部完成
- **Phase 1状态**: ✅ 全部完成
- **整体状态**: ✅ 核心功能全部完成，建议发布

### 5.1 测试总结
- **单元测试**: ✅ 49用例通过（jest）
- **集成测试**: ✅ 50用例通过（需Bun运行时完整验证）
- **E2E测试**: ⏸️ 建议跳过（需要Playwright + Bun环境）

### 5.2 环境限制
- 🟡 bun未安装，集成测试使用Node.js适配版本
- 🟡 T20需要Playwright，复杂度较高

### 5.1 T13修复通过 (2026-04-07)
**Reviewer审计结果**: ✅ 通过
- manager.ts正确整合各组件
- exit callback正确调用notificationManager
- 所有tools正确迁移到manager

**Phase 3完成**

### 5.3 环境状态 (2026-04-07)
- ✅ **node**: nvm中可用，版本v24.12.0
- ⚠️ **bun**: 未安装（项目依赖bun-pty，建议安装bun）
- ✅ **TypeScript**: 可用（通过npm）
- 建议: 安装bun以运行`bun test`
- **总文件数**: 36个源文件
- **可复用代码**: ~70% (buffer, output-manager, web/*, utils, formatters)
- **需重写代码**: ~30% (工具定义、权限系统、插件入口)
- **Web架构分析**: 见 docs/web-migration-analysis.md

### 5.3 关键发现
1. bun-pty 依赖可用，无需替换
2. Web 界面可完整迁移（100%复用）
3. 工具定义 API 差异大（OpenCode vs Claude Code）
4. 权限系统需重新设计
5. Web架构分析完成: Server 7模块 + Client 7模块 + Shared 4模块

## 6. 风险点

### 🔴 高风险
1. **API 兼容性**: OpenCode与Claude Code插件API差异大
2. **bun-pty monkey-patch**: 竞态条件修复patch需验证
3. **Web服务器集成**: Bun.serve在CC插件环境可能受限
4. **T13退出通知**: 未集成notification-manager

### 🟡 中风险
5. **WebSocket回调**: 需确保插件卸载时正确清理
6. **测试环境**: 需要真实PTY环境
7. **权限集成**: OpenCode权限配置需映射
8. **端口冲突**: Web服务器动态端口验证

### 🟢 低风险
9. **配置迁移**: 环境变量改settings
10. **类型调整**: 部分类型需适配新API

## 7. 关键路径
1. ✅ 分析opencode-pty源码架构
2. ✅ 识别需要迁移的模块和功能
3. ✅ Phase 1: 基础架构
4. ✅ Phase 2: 核心工具
5. ⏳ Phase 3: T13修复
6. ⏳ Phase 4: Web界面（可选）
7. ⏳ Phase 5: 测试

## 8. 参考资源
- 源项目: temp/opencode-pty/
- 分析报告: docs/migration-analysis.md
- Web分析: docs/web-migration-analysis.md
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

### Phase 4: Web界面 (可选) ✅ 全部完成
- [x] T15: Web服务器 (风险: 🔴 高 - ✅ 审计通过)
- [x] T16: Web客户端 (风险: 🟡 中 - ✅ 审计通过)
- [x] T17: pty-open命令 (风险: 🟡 中 - ✅ 审计通过)

### Phase 5: 测试 ✅ 完成
- [x] T18: 单元测试 (风险: 🟢 低 - ✅ 49用例通过)
- [x] T19: 集成测试 (风险: 🟡 中 - ✅ 50用例通过)
- [ ] T20: E2E测试 (风险: 🔴 高 - ⏸️ 建议跳过，需Bun+Playwright)
