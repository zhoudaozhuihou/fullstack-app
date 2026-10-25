# VS Code 多 Agent 全栈开发团队 · 技能包

本目录提供**手动多会话协作**的角色提示词与模板；Copilot 侧的技能已迁移至原生发现位置 `.github/skills/`。

## 会话角色（手动模式）

| 会话 | 角色 | 提示词文件 | 职责 |
|------|------|-----------|------|
| 1 | 🧭 调度者 Orchestrator | `roles/01-orchestrator.md` | 拆解需求、生成任务卡、分派、追踪进度、仲裁冲突 |
| 2 | 👨‍💻 开发者 Developer | `roles/02-developer.md` | 写代码（FastAPI / Spring Boot / React） |
| 3 | 🧪 测试者 Tester | `roles/03-tester.md` | 写测试、跑测试、出测试报告 |
| 4 | 🔍 审查者 Reviewer | `roles/04-reviewer.md` | 代码审查、安全审查、验收把关 |

## 使用方法

1. 推荐在 VS Code 中使用工作区 `.github/agents/` 下的自定义 Agent：选择 `orchestrator`，由其按需委派 `planner / developer / tester / reviewer / security-auditor / researcher`；仅对互不冲突的工作并行委派。
2. 也可手动启动多个 Agent 会话，并将对应 `roles/*.md` 的内容作为首条提示词。
3. 所有 Agent 遵守根目录 `AGENTS.md` 与 `.github/copilot-instructions.md`，通过 `docs/tasks/`、`docs/handoffs/`、`docs/reports/` 文件协作。

## 技能文件（Copilot 原生位置，按需自动加载）

技能已迁移到 `.github/skills/`：

- `python-fastapi/SKILL.md` — Python 3.11+ / FastAPI 后端规范
- `springboot/SKILL.md` — Spring Boot 3 / Java 17 后端规范
- `react-mui-tailwind/SKILL.md` — React 18 + Material UI + Tailwind CSS 前端规范
- `testing/SKILL.md` — 测试策略与标准（pytest / JUnit / Vitest + Playwright）
- `review/SKILL.md` — 审查清单（正确性 / 安全 / 性能 / 架构）
- `git-workflow/SKILL.md` — 分支与提交规范（Conventional Commits）
- `api-contract/SKILL.md` — API 契约优先工作流
- `database-migrations/SKILL.md` — Alembic / Flyway 迁移规范
- `debugging/SKILL.md` — 系统化调试流程
- `docker-deploy/SKILL.md` — Docker 与部署规范

## 模板

- `templates/task-card.md` — 任务卡（调度的最小分派单位）
- `templates/handoff.md` — 会话间交接单（开发 → 测试 / 测试 → 审查）
- `templates/project-structure.md` — 推荐的 Monorepo 项目结构

## 建议的项目结构

见 `templates/project-structure.md`。核心思路：`backend-py/`（FastAPI）、`backend-java/`（Spring Boot）、`frontend/`（React）三服务并行，`docs/tasks/` 作为 Agent 间通信总线。
