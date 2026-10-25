# Copilot 项目说明（始终加载）

你正在 fullstack-app 仓库工作：一个**多 Agent 协作的全栈实例项目**，同时内置 VS Code Copilot 自定义能力（Agent / Skill / Tool / Hooks / Memory）。

## 必读规范（按需加载，避免全文塞入上下文）

- 共享工程规范：`AGENTS.md`（所有 Agent 遵守）
- 项目背景与架构：`docs/memory/project-overview.md`、`docs/memory/architecture.md`
- 技术栈规范：`.github/skills/<skill>/SKILL.md`（按当前任务加载对应技能）

## 铁律（最高优先级）

1. 代码、注释、commit message 用英文；文档、任务卡用中文。
2. **API 契约优先**：涉及接口先读 `docs/api/`；契约缺失或含糊时先补齐并确认，不得擅自猜测接口。
3. 配置一律走环境变量 + `.env.example`；禁止提交任何密钥、`.env` 实际值。
4. 每个任务卡一个分支 `feat/Txxx-短描述`；commit 用 Conventional Commits 并带任务卡号。
5. 只做任务卡范围内的事；发现相邻问题 → 新建任务卡交调度者，不擅自扩展。

## 协作总线（文件驱动，不靠聊天记忆）

- 任务卡：`docs/tasks/`（状态 `TODO → IN_PROGRESS → DEV_DONE → TESTING → REVIEW → DONE` 或 `BLOCKED`）
- 交接单：`docs/handoffs/`；报告：`docs/reports/`；决策：`docs/decisions/`；项目知识库：`docs/memory/`

## 本仓库自定义能力

- **子 Agent**：`.github/agents/*.agent.md`。选择 `orchestrator`，由其按需委派 `planner / developer / tester / reviewer / security-auditor / researcher`。
- **技能**：`.github/skills/*/SKILL.md`（原生发现位置，按相关性自动加载）。
- **钩子**：`.github/hooks/*.json`（安全护栏、上下文注入、编辑后自动格式化）。
- **工具（MCP）**：`.vscode/mcp.json`（含本地 `taskboard` 任务板服务器）。
- **记忆**：本文件（项目说明）+ `docs/memory/`（知识库）+ VS Code 本地 memory 工具。

## 回复约定

- 汇报**真实执行**的命令与结果，不臆造测试/审查/任务状态。
- 未经用户要求不创建提交；如任务规范要求提交，先遵守仓库 Conventional Commits 规则。
