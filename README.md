# Fullstack App — 多 Agent 协作标准实例项目

本仓库是一个**标准实例项目**：既包含可运行的全栈三服务骨架，也内置了 VS Code Copilot 自定义能力（Agent / Skill / Tool / Hooks / Memory）与多 Agent 协作规范。

## 项目组成

| 目录 | 说明 |
|------|------|
| `backend-py/` | FastAPI 服务（Python ≥ 3.11，SQLAlchemy 2.0 async，Alembic） |
| `backend-java/` | Spring Boot 3 服务（Java 17，Maven，Flyway，springdoc） |
| `frontend/` | React 18 + TypeScript + Vite + Material UI v5 + Tailwind CSS v3 |
| `docs/` | Agent 协作总线：任务卡 / 交接单 / 报告 / API 契约 / ADR / 项目记忆 |
| `.github/` | Copilot 自定义能力：agents / skills / hooks / workflows |
| `agent-team/` | 手动多会话协作包（roles + templates） |
| `tools/` | 本地 MCP 服务器（taskboard 任务板） |
| `deploy/` | docker-compose 本地编排 |
| `.vscode/` | mcp.json（MCP 服务器）、settings.json |

## 快速开始

```bash
# FastAPI
cd backend-py && pip install -e ".[dev]" && uvicorn app.main:app --reload

# Spring Boot
cd backend-java && mvn spring-boot:run

# 前端
cd frontend && npm install && npm run dev

# 一键编排（postgres + redis）
cd deploy && docker compose up -d
```

## Copilot 自定义能力（五大件）

| 能力 | 位置 | 说明 |
|------|------|------|
| **Agent** | `.github/agents/*.agent.md` | 7 个子代理：orchestrator / planner / developer / tester / reviewer / security-auditor / researcher |
| **Skill** | `.github/skills/*/SKILL.md` | 10 个技能：技术栈规范 + 流程规范（自动按需加载） |
| **Tool** | `.vscode/mcp.json` + `tools/taskboard-mcp/` | 本地 MCP 服务器读写任务卡；可扩展 context7/playwright 等 |
| **Hooks** | `.github/hooks/*.json` | 安全护栏 / 上下文注入 / 质量门禁 |
| **Memory** | `.github/copilot-instructions.md` + `docs/memory/` | 始终加载的项目说明 + 版本化知识库 |

详见 [`docs/agent-capabilities.md`](./docs/agent-capabilities.md)。

## Agent 协作规范

所有 Agent 会话必须遵守根目录 [`AGENTS.md`](./AGENTS.md)。本项目支持 Copilot 子 Agent，也保留手动多会话协作：

### 使用 Copilot 子 Agent（推荐）

1. 在 VS Code 中打开本仓库，并在 Copilot Chat 的 Agent 选择器中选择 `orchestrator`。
2. 描述需求；调度者会按需委派 `planner`（契约/设计/拆卡）、`developer`、`tester`、`reviewer` 与 `security-auditor`，有依赖的工作按 规划 → 开发 → 测试 → 审查 顺序进行，互不冲突的实现任务才并行。
3. 工作区 Agent 定义位于 `.github/agents/`，技能位于 `.github/skills/`，钩子位于 `.github/hooks/`。
4. 任务卡、交接单和报告继续通过 `docs/tasks/`、`docs/handoffs/`、`docs/reports/` 文件流转；也可用 MCP `taskboard` 工具读写任务卡。

### 手动多会话

也可继续按 `agent-team/roles/` 中的调度、开发、测试、审查提示词分别启动多个会话；跨会话仍通过上述文档文件交接。

`docs/tasks/T001-*.md` 是一张示例任务卡，可作为第一张卡的参考格式。
