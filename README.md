# Fullstack App — 多 Agent 协作全栈实例项目

一个**可运行的全栈三服务骨架** + **VS Code Copilot 自定义能力**（Agent / Skill / Tool / Hooks / Memory）标准实例项目。既可当作新项目的脚手架，也可当作 Copilot 多 Agent 开发模板直接使用。

---

## 目录

- [项目是什么](#项目是什么)
- [功能特性](#功能特性)
- [目录结构](#目录结构)
- [前置要求](#前置要求)
- [快速开始](#快速开始)
- [环境变量配置](#环境变量配置)
- [如何使用 Copilot 五大能力](#如何使用-copilot-五大能力)
  - [1. Agent（子代理）](#1-agent子代理)
  - [2. Skill（技能）](#2-skill技能)
  - [3. Tool（MCP 工具）](#3-toolmcp-工具)
  - [4. Hooks（钩子）](#4-hooks钩子)
  - [5. Memory（记忆）](#5-memory记忆)
- [多 Agent 开发工作流](#多-agent-开发工作流)
- [把本项目当模板使用](#把本项目当模板使用)
- [测试与 CI](#测试与-ci)
- [常见问题](#常见问题)

---

## 项目是什么

| 组成 | 说明 |
|------|------|
| `backend-py/` | FastAPI 服务（Python ≥ 3.11，SQLAlchemy 2.0 async，Alembic） |
| `backend-java/` | Spring Boot 3 服务（Java 17，Spring Security + JPA + Flyway + springdoc） |
| `frontend/` | React 18 + TypeScript + Vite + Material UI v5 + Tailwind CSS v3 |
| `docs/` | Agent 协作总线：任务卡 / 交接单 / 报告 / API 契约 / ADR / 项目记忆 |
| `.github/` | Copilot 自定义能力：agents / skills / hooks / workflows |
| `tools/` | 本地 MCP 服务器（taskboard 任务板） |
| `deploy/` | docker-compose 本地编排（postgres + redis） |
| `.vscode/` | mcp.json（MCP 服务器）、settings.json |

## 功能特性

- ✅ **7 个 Copilot 子代理**：orchestrator / planner / developer / tester / reviewer / security-auditor / researcher
- ✅ **10 个技能**：技术栈规范 + 流程规范，按任务相关性自动加载
- ✅ **本地 MCP 工具**：零依赖 `taskboard` 服务器，程序化读写任务卡
- ✅ **3 个生命周期钩子**：安全护栏 / 上下文注入 / 质量门禁
- ✅ **三层记忆**：项目说明 + 版本化知识库 + 本地 memory 工具
- ✅ **多 Agent 文件总线**：任务卡、交接单、报告、决策记录规范流转

## 目录结构

```
fullstack-app/
├── AGENTS.md                      # 全体 Agent 共享规范
├── .github/
│   ├── copilot-instructions.md    # 始终加载的项目说明（Memory）
│   ├── agents/                    # 自定义子代理（*.agent.md）
│   ├── skills/                    # 技能（*/SKILL.md）
│   ├── hooks/                     # 钩子（*.json + scripts/）
│   └── workflows/ci.yml           # 三服务并行 CI
├── docs/
│   ├── agent-capabilities.md      # 五大能力总览与扩展指南
│   ├── api/  tasks/  handoffs/  reports/  decisions/  memory/
├── tools/taskboard-mcp/           # 本地 MCP 服务器
├── .vscode/                       # mcp.json + settings.json
├── agent-team/                    # 手动多会话协作包（roles + templates）
├── backend-py/  backend-java/  frontend/  deploy/
```

## 前置要求

| 工具 | 版本 | 用途 |
|------|------|------|
| [VS Code](https://code.visualstudio.com/) | 最新版 | 编辑器（推荐 Insiders 以启用 Preview 能力） |
| [GitHub Copilot](https://code.visualstudio.com/docs/setup/copilot) | 已登录订阅 | Agent / Skill / Hooks / Memory 运行时 |
| Python | ≥ 3.11 | backend-py |
| Java (JDK) | ≥ 17 | backend-java |
| Node.js | ≥ 20 | frontend + hooks/MCP 脚本 |
| Maven | 3.8+ | backend-java 构建 |
| Docker | 任意 | postgres + redis 本地编排 |

> 仅想跑服务可跳过 VS Code/Copilot；想用 Agent/Skill/Hooks/Memory 则需要 Copilot 订阅。

## 快速开始

### 1. 克隆仓库

```bash
git clone git@github.com:zhoudaozhuihou/fullstack-app.git
cd fullstack-app
```

### 2. 启动基础设施（PostgreSQL 15 + Redis 7）

```bash
cd deploy && docker compose up -d
```

### 3. 启动 FastAPI（端口 8000）

```bash
cd ../backend-py
cp .env.example .env          # 按需修改 JWT_SECRET 等
pip install -e ".[dev]"
uvicorn app.main:app --reload
```

- 健康检查：http://localhost:8000/api/v1/health
- 交互文档（OpenAPI）：http://localhost:8000/docs

### 4. 启动 Spring Boot（端口 8081，需 postgres）

```bash
cd ../backend-java && mvn spring-boot:run
```

- 健康检查：http://localhost:8081/api/v1/java/health
- API 文档：http://localhost:8081/v3/api-docs ｜ Swagger UI：http://localhost:8081/swagger-ui/index.html

### 5. 启动前端（端口 5173）

```bash
cd ../frontend
cp .env.example .env          # VITE_API_BASE_URL 指向 FastAPI
npm install && npm run dev
```

- 页面：http://localhost:5173

> **说明**：`deploy/docker-compose.yml` 目前只编排 postgres + redis；三服务的 Dockerfile 尚未提供（见 [`docker-deploy`](.github/skills/docker-deploy/SKILL.md) 技能），服务请先用上面的本地命令启动。

## 环境变量配置

所有配置走环境变量 + `.env.example`，**禁止提交真实 `.env` 或密钥**（见 [`AGENTS.md`](AGENTS.md)）。

- `backend-py/.env.example`：`DATABASE_URL`、`REDIS_URL`、`JWT_SECRET`、`JWT_ALGORITHM`、`ACCESS_TOKEN_EXPIRE_SECONDS`、`CORS_ORIGINS`
- `frontend/.env.example`：`VITE_API_BASE_URL`
- `backend-java`：通过 `SPRING_DATASOURCE_URL / SPRING_DATASOURCE_USERNAME / SPRING_DATASOURCE_PASSWORD` 覆盖（见 `src/main/resources/application.yml`）

---

## 如何使用 Copilot 五大能力

完整说明见 [`docs/agent-capabilities.md`](docs/agent-capabilities.md)，这里给出上手步骤。

### 1. Agent（子代理）

1. 在 VS Code 中打开本仓库。
2. 在 Copilot Chat 的 **Agent 选择器**里选 `orchestrator`。
3. 直接描述需求，调度者会按需委派 `planner → developer → tester → reviewer → security-auditor`，互不冲突的任务才并行。
4. 也可单独选择某个 Agent（如 `reviewer`）直接使用；`researcher` 用于只读调研。

> 工作区 Agent 定义在 [`.github/agents/`](.github/agents/)，按 `.agent.md` 的 YAML frontmatter + Markdown 指令编写。

### 2. Skill（技能）

- 技能在 [`.github/skills/`](.github/skills/)，**按任务相关性自动加载**，无需手动指定。
- 也可在聊天输入框用 `/` 调出技能列表，以斜杠命令方式手动调用（如 `/python-fastapi`、`/testing`）。
- 写代码/跑测试/审查时，对应技能（技术栈规范、测试标准、审查清单等）会被自动注入。

### 3. Tool（MCP 工具）

- 本地 `taskboard` 服务器已在 [`.vscode/mcp.json`](.vscode/mcp.json) 注册，Copilot 会在需要时自动调用，用 `list_tasks / get_task / create_task / update_task` 读写 [`docs/tasks/`](docs/tasks/) 任务卡。
- 想加外部 MCP（如 `context7` 拉框架文档、`playwright` 做浏览器自动化），在 `.vscode/mcp.json` 里追加即可（示例见 [`docs/agent-capabilities.md`](docs/agent-capabilities.md#3-toolmcp-服务器)）。

### 4. Hooks（钩子）

- [`.github/hooks/`](.github/hooks/) 里的钩子自动生效：
  - `security.json`（PreToolUse）：拦截危险命令、受保护文件、疑似密钥写入。
  - `context.json`（SessionStart）：会话开始注入项目背景、当前分支、必读文档指针。
  - `quality.json`（PostToolUse）：编辑代码后提醒运行对应 lint/type-check/test。
- 本地可验证：
  ```bash
  echo '{"tool_name":"Bash","tool_input":{"command":"rm -rf /usr"}}' | node .github/hooks/scripts/guard-tools.mjs
  ```

### 5. Memory（记忆）

- [`.github/copilot-instructions.md`](.github/copilot-instructions.md)：始终加载的项目说明（铁律 + 协作总线）。
- [`docs/memory/`](docs/memory/)：版本化知识库（项目概览、架构），Agent 处理任务时按需读取。
- VS Code 本地 memory 工具（`Chat: Show Memory Files`）保存个人/会话级偏好，不入库。

---

## 多 Agent 开发工作流

所有会话遵守 [`AGENTS.md`](AGENTS.md)，跨会话通过文件协作：

```
需求 → planner 写 API 契约 + 拆任务卡（docs/tasks/、docs/api/）
     → developer 实现（→ docs/handoffs/ 交接）
     → tester 测试（→ docs/reports/TEST-Txxx.md）
     → reviewer + security-auditor 审查（→ docs/reports/REVIEW-Txxx.md）
     → DONE
```

- **状态流转**：`TODO → IN_PROGRESS → DEV_DONE → TESTING → REVIEW → DONE`（或 `BLOCKED`）
- **一张示例任务卡**：[`docs/tasks/T001-login-api.md`](docs/tasks/T001-login-api.md)，可作为第一张卡的格式参考。
- **任务卡模板**：[`agent-team/templates/task-card.md`](agent-team/templates/task-card.md)

## 把本项目当模板使用

**方式 A：GitHub 网页「Use this template」**（推荐，保留模板关联）

1. 打开仓库主页 → **Use this template** → 选 Owner/名称 → Create。
2. 新仓库即含全部代码与 `.github/` 能力。

**方式 B：克隆后重命名（最简单）**

```bash
git clone git@github.com:zhoudaozhuihou/fullstack-app.git my-new-app
cd my-new-app
rm -rf .git && git init -b main
# 全局替换项目名与包名（com.example → 你的域名；backend-py → 你的服务名等）
git add -A && git commit -m "chore: init from fullstack-app template"
```

之后按「快速开始」起服务，按「多 Agent 开发工作流」开始开发。

## 测试与 CI

```bash
# FastAPI
cd backend-py && ruff check app tests && mypy app && pytest -q

# Spring Boot
cd backend-java && mvn -q verify

# 前端
cd frontend && npm run lint && npx tsc --noEmit && npm run test && npm run build
```

CI（[`.github/workflows/ci.yml`](.github/workflows/ci.yml)）在 push/PR 时并行跑三服务 lint + test。

---

## 常见问题

**Q：Copilot Chat 里看不到自定义 Agent / 技能？**
确认：① 仓库根目录为工作区根；② Copilot 已登录；③ VS Code 版本较新（部分能力为 Preview，需 Insiders）。技能需在 `.github/skills/` 且 `SKILL.md` 的 `name` 与目录名一致。

**Q：`mvn spring-boot:run` 报数据库连接失败？**
Spring Boot 依赖 postgres（Flyway）。先 `cd deploy && docker compose up -d` 起库，再启动。

**Q：钩子没触发？**
钩子为 Preview 能力，不同 harness（Copilot/Local/Claude/Codex）行为略有差异。先按 [`docs/agent-capabilities.md`](docs/agent-capabilities.md) 的「快速验证」确认脚本本身正常。

**Q：MCP `taskboard` 工具不出现？**
确认 `.vscode/mcp.json` 已提交且在编辑器里被识别；重启 VS Code 或重载窗口（`Developer: Reload Window`）。

**Q：想新增一个 Agent / Skill / Hook？**
参考 [`docs/agent-capabilities.md`](docs/agent-capabilities.md) 各节的「新增」模板，放对目录即可被自动发现。
