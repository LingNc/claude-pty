# Claude-PTY MCP迁移团队

## 团队目标
将claude-pty从Claude Code插件迁移为MCP服务器，同时保持插件兼容性。

## 当前阶段
**MCP迁移项目完成 ✅** (2026-04-08)

## 任务状态
| 任务ID | 描述 | 状态 | 负责人 |
|--------|------|------|--------|
| T1-T3 | Phase 1 基础架构 | ✅ completed | coder |
| T4-T8 | 5个工具迁移 | ✅ completed | coder |
| T9 | 工具注册中心 | ✅ completed | coder |
| T10-T12 | Phase 3 核心适配 | ✅ completed | coder |
| T13 | MCP单元测试 | ✅ 33测试通过 | tester |
| T14 | 集成测试 | ✅ 14测试通过 | tester |
| T15 | CC集成 | ✅ 手动验证文档 | tester |
| T16 | 文档更新 | ✅ completed | analyst |
| T17 | 发布包 | ✅ completed | coder |

**总计: 47个自动化测试通过, 17个任务完成**

## 关键决策
1. notify替代: console.error() → stderr
2. 权限策略: 简化，依赖MCP客户端
3. 复用方式: 符号链接 src/pty

## Git分支规范 ⚠️ 务必遵守

### 分支模型 (Git Flow)
```
main  ←  只接受release合并，不直接提交代码
 ↑
 └─ dev  ←  日常开发分支
```

### 开发流程
1. **从dev起点开始**: dev分支必须从上一个版本的`release: 版本号更新为vX.X.X`提交开始
2. **在dev开发**: 所有开发提交(push, feat, fix, docs等)必须在dev分支
3. **非快进式合并**: dev合并到main必须使用`git merge --no-ff`保留合并节点
4. **打标签**: 合并后在main分支打版本标签`vX.X.X`

### 禁止事项
- ❌ 禁止直接在main分支提交开发代码
- ❌ 禁止快进式合并(fast-forward)
- ❌ 禁止在main分支打非release标签

### 示例
```bash
# 1. 在dev开发
git checkout dev
# ... 开发提交 ...

# 2. 更新版本号
git commit -m "release: 版本号更新为v0.5.0"

# 3. 合并到main (非快进式)
git checkout main
git merge dev --no-ff -m "release: claude-pty v0.5.0"

# 4. 打标签
git tag -a v0.5.0 -m "release: claude-pty v0.5.0"

# 5. 推送
git push origin main && git push origin v0.5.0
```

### 历史参考
- v0.4.0: b8ba208 (main合并节点)
  - dev: b6daee9 → 6fe741b → ... → dfe1470
  - 正确结构: dev和main分开，有明确合并节点

## 参考文档

- MCP SDK: /modelcontextprotocol/typescript-sdk
- 现有插件: src/tools/*.ts
- PTY管理器: src/pty/manager.ts

## 团队规则

1. 严格听从Leader指挥
2. 不可越权操作
3. 完成任务后及时汇报
4. commit信息简短，无Co-authored-by
5. 发现问题立即上报

## 汇报格式

```
1. 已完成: [内容]
2. 阻塞/风险: [问题或"无"]
3. 下一步: [建议]
```

---

## 历史记录

### 2026/04/08
- 启动MCP迁移项目
- Analyst完成全面分析
- T1-T12 开发全部完成
- T13-T14 测试通过 (47个测试)
- T15 手动验证文档
- T16-T17 文档和发布完成
- **项目完成 ✅**
