# 项目概览

## 一句话

`fullstack-app` 是一个**可运行的全栈三服务骨架** + **VS Code 多 Agent 协作规范**的标准实例项目，用于作为新项目脚手架与 Copilot 自定义能力模板。

## 组成

| 目录 | 说明 | 技术栈 |
|------|------|--------|
| `backend-py/` | FastAPI 服务 | Python ≥ 3.11，FastAPI + Pydantic v2 + SQLAlchemy 2.0(async) + Alembic |
| `backend-java/` | Spring Boot 服务 | Java 17，Spring Boot 3 + Spring Security + JPA + Flyway + springdoc |
| `frontend/` | Web 前端 | React 18 + TypeScript + Vite + Material UI v5 + Tailwind CSS v3 |
| `docs/` | Agent 协作总线 | 任务卡 / 交接单 / 报告 / API 契约 / ADR / 项目记忆 |
| `agent-team/` | 手动多会话协作包 | roles + templates（提示词与模板） |
| `.github/` | Copilot 自定义能力 | agents / skills / hooks / workflows |
| `tools/` | 本地 MCP 服务器 | taskboard 任务板 |
| `deploy/` | 本地编排 | docker-compose（postgres + redis + 服务） |
| `.vscode/` | 编辑器配置 | mcp.json（MCP 服务器）、settings.json |

## 技术栈基线

见 `AGENTS.md` 第 2 节。要点：Python ≥ 3.11、Java ≥ 17、Node ≥ 20、PostgreSQL 15、Redis 7。

## 协作模型

- **Copilot 子 Agent（推荐）**：选择 `orchestrator`，由其委派 `planner / developer / tester / reviewer / security-auditor / researcher`，按 开发 → 测试 → 审查 顺序流转，互不冲突的实现任务并行。
- **手动多会话**：按 `agent-team/roles/*.md` 分别启动会话，仍通过 `docs/` 文件总线交接。

## 命名与语言约定

- 代码 / 注释 / commit 用英文；文档 / 任务卡 / 报告用中文。
- 分支 `feat/Txxx-短描述`；commit 用 Conventional Commits 并带任务卡号。
