# Fullstack App — Copilot 多 Agent 开发模板

一个**全栈三服务脚手架** + **VS Code Copilot 自定义能力**（Agent / Skill / Tool / Hooks / Memory）模板。开箱即用：把它作为工作区在 VS Code Agent Window 中打开，即可用多 Agent 协作开发。

> 使用前请先读本文件的「在 VS Code Agent Window 中使用」一节，这是核心用法。

---

## 目录

- [前置要求](#前置要求)
- [在 VS Code Agent Window 中使用](#在-vs-code-agent-window-中使用)
  - [把目录接入 Agent Window](#把目录接入-agent-window)
  - [启动多个 session 同步开发](#启动多个-session-同步开发)
- [内置的 Copilot 自定义能力](#内置的-copilot-自定义能力)
- [运行服务（可选）](#运行服务可选)
- [测试与 CI](#测试与-ci)
- [进一步阅读](#进一步阅读)

---

## 前置要求

| 工具 | 版本 | 用途 |
|------|------|------|
| [VS Code](https://code.visualstudio.com/) | 最新版（推荐 Insiders） | 编辑器 + Agent Window |
| [GitHub Copilot](https://code.visualstudio.com/docs/setup/copilot) | 已登录订阅 | Agent / Skill / Hooks / Memory 运行时 |
| Git / Node.js / Python / Java | 按需 | 运行服务与钩子脚本（Node ≥ 20、Python ≥ 3.11、Java ≥ 17） |

---

## 在 VS Code Agent Window 中使用

### 把目录接入 Agent Window

```bash
git clone git@github.com:zhoudaozhuihou/fullstack-app.git
cd fullstack-app
code .            # 1) 在主窗口打开该目录作为工作区
code --agents     # 2) 打开 Agents Window（或在标题栏点 "Open in Agents"）
```

> 关键：`.github/agents/`、`.github/skills/`、`.github/hooks/`、`.github/copilot-instructions.md` 都在**工作区根目录**，VS Code 会自动发现加载，无需手动引入。

**新建第一个会话：**

1. Agents Window 左侧点 **New**（或工作区上的 **+**）。
2. 选 **Folder** → `fullstack-app`（作为主执行工作区）。
3. **Session Target** 选 **Copilot**。
4. Agent 选择器选 `orchestrator`（本仓库的调度者）。
5. 输入需求，回车。

验证接入成功，直接问：

```text
列出这个工作区可用的自定义 Agent、技能和钩子。
```

### 启动多个 session 同步开发

**方式一：单会话子代理（默认，最简单）** —— 选 `orchestrator`，它会自动委派 `planner → developer → tester → reviewer → security-auditor`，状态写入 `docs/tasks/`、报告写入 `docs/reports/`。

**方式二：多 session 并行独立任务** —— 两个互不相关的任务同时做，每个 session 勾选 **New Worktree**（从同一集成分支派生）隔离改动：

1. 主工作区：提交共享改动，`git checkout -b integrate-agent-tasks` 建集成分支。
2. **New** → 选 `fullstack-app` → Copilot → 勾 **New Worktree**（基线 `integrate-agent-tasks`）→ 输入任务 A。
3. 按住 `Alt/Option` 再点 **New**，同法建任务 B 的 worktree 会话。
4. 左侧 sessions list 监控，可拖拽成网格并排查看。
5. 各自 **Changes** 审查 → 逐个 **Merge Changes** 合回集成分支 → 合并后重跑测试。

**方式三：多 session 角色团队** —— 用 `agent-team/roles/*.md` 各开一个会话（调度/开发/测试/审查），通过 `docs/` 文件总线协作；开发→测试→审查按流水线走，仅文件不重叠的任务才并行。

> 详细分步、prompt 模板、会话监控与合并操作见 [`docs/vscode-agent-window.md`](docs/vscode-agent-window.md)。

---

## 内置的 Copilot 自定义能力

| 能力 | 位置 | 内容 |
|------|------|------|
| **Agent** | `.github/agents/*.agent.md` | 7 个：orchestrator / planner / developer / tester / reviewer / security-auditor / researcher |
| **Skill** | `.github/skills/*/SKILL.md` | 10 个：技术栈规范 + 流程规范，按需自动加载 |
| **Tool** | `.mcp.json` + `tools/taskboard-mcp/` | 本地零依赖 `taskboard` MCP 服务器，读写任务卡 |
| **Hooks** | `.github/hooks/*.json` | 安全护栏 / 上下文注入 / 编辑后自动格式化 |
| **Memory** | `.github/copilot-instructions.md` + `docs/memory/` | 始终加载项目说明 + 版本化知识库 |

扩展方式见 [`docs/agent-capabilities.md`](docs/agent-capabilities.md)。

---

## 运行服务（可选）

仅当需要在本机跑通三服务时才用；Agent 开发不强制先起服务。

```bash
# 基础设施（PostgreSQL 15 + Redis 7）
cd deploy && docker compose up -d

# FastAPI（:8000，健康检查 /api/v1/health，文档 /docs）
cd ../backend-py && cp .env.example .env && pip install -e ".[dev]" && uvicorn app.main:app --reload

# Spring Boot（:8081，健康检查 /api/v1/java/health，文档 /v3/api-docs）
cd ../backend-java && mvn spring-boot:run

# 前端（:5173）
cd ../frontend && cp .env.example .env && npm install && npm run dev
```

环境变量见各服务的 `.env.example`；`docker-compose` 目前只编排 postgres/redis，三服务 Dockerfile 待补（见 `.github/skills/docker-deploy/SKILL.md`）。

---

## 测试与 CI

```bash
cd backend-py && ruff check app tests && mypy app && pytest -q    # FastAPI
cd backend-java && mvn -q verify                                 # Spring Boot
cd frontend && npm run lint && npx tsc --noEmit && npm run test && npm run build
```

CI（`.github/workflows/ci.yml`）在 push/PR 时并行跑三服务 lint + test。

---

## 进一步阅读

- [在 VS Code Agent Window 中使用（操作手册）](docs/vscode-agent-window.md) —— 多 session 并行、监控、合并的完整步骤
- [Agent 自定义能力总览](docs/agent-capabilities.md) —— 五大能力的扩展方法
- [AGENTS.md](AGENTS.md) —— 全体 Agent 共享规范
- [docs/memory/](docs/memory/) —— 项目知识库与记忆模型
