## 分支与 Git 协作策略
1. 长期分支定义
   1. main：稳定发布分支。仅包含最终可运行的插件核心代码，严禁保留 docs/ 目录、AGENTS.md 等开发过程文件。
   2. develop：核心开发分支。所有迁移代码、PTY 适配逻辑、文档更新与团队状态同步均在此分支进行。
   3. feat/pty-<模块名>：用于迁移特定 PTY 功能模块或新增插件特性。
   4. fix/pty-<问题简述>：用于修复迁移或适配过程中发现的运行时缺陷。

2. 开发与提交规范
   1. 分支流转：新模块从 develop 切出 `feat/pty-<模块名>`。若需细化，可继续基于特性分支切出子分支 `feat/pty-<模块名>/<子功能>` 独立开发。
   2. 合并逻辑：子分支完成后使用 `--no-ff` 合并至父特性分支，随后删除子分支；所有子功能验证完毕后，再将特性分支 `--no-ff` 合并至 develop，并清理临时分支。
   3. 提交要求：Commit 信息必须简短精准（例：`feat: 适配 claude-code 终端信号流`）。严禁附带 Co-authored-by 或任何作者署名元数据，保持提交历史绝对简洁。

3. 发布合并流程（develop -> main）
   1. 切换至稳定分支：`git checkout main`
   2. 合并开发进度但暂停生成提交：`git merge --no-ff --no-commit develop`
   3. 清理开发期专用资产（确保 main 纯净，且不影响 develop 分支）：`git rm -r -f docs/ AGENTS.md 2>/dev/null || echo "开发文件已清理"`
   4. 生成版本节点：`git commit -m "release: claude-pty 插件xx更新发布"`
   5. 推送并同步标签：`git push origin main --tags`

4. 紧急修复流程（Hotfix）
   1. 若 main 发布后出现严重兼容或 PTY 异常，直接从 main 切出 `fix/pty-<版本或描述>` 分支进行修复。
   2. 修复验证通过后，依次合并回 develop 和 main，确保双端逻辑与版本状态完全一致。