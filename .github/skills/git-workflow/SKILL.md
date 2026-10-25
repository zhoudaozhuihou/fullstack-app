---
name: git-workflow
description: 分支与提交规范（Conventional Commits + 任务卡号、feat/Txxx 分支、受保护 main）。Use when creating branches, committing changes, or preparing a pull request.
---

# SKILL: Git 工作流与提交规范

适用：所有角色的提交与分支操作。遵守根目录 `AGENTS.md` 第 3 节。

## 分支模型

- `main` 受保护，不直接提交。
- 每个任务卡一个分支：`feat/Txxx-短描述`（如 `feat/T001-login-api`）。
- 修复类可 `fix/Txxx-短描述`；文档类可 `docs/短描述`；重构类 `refactor/短描述`。

## 提交信息（Conventional Commits）

```
<type>: <subject> (Txxx)

<可选 body，说明动机与上下文>
```

- type：`feat` / `fix` / `test` / `refactor` / `docs` / `chore` / `ci` / `perf`。
- subject：英文，祈使句，≤ 72 字符，首字母小写。
- 尾部带任务卡号，如 `feat: add login endpoint (T001)`。

## 操作规范

1. 提交前先自检（lint / type-check / test），见各技术栈 SKILL.md 的验收命令。
2. **禁止提交**：`.env` 实际值、密钥、证书、`node_modules/`、`target/`、构建产物（遵守 `.gitignore`）。
3. 一次提交聚焦一个意图；不要混入无关改动。
4. 未经用户要求不创建提交；由调度者按需触发。
5. 推送前先 `git pull --rebase`（或按团队约定），避免无意义 merge commit。

## 常用命令

```bash
git checkout -b feat/T001-login-api
git add <files> && git commit -m "feat: add login endpoint (T001)"
git log --oneline -5          # 检查提交历史
git diff --stat               # 检查本次改动范围
```
