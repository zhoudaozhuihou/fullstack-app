# AGENTS.md — 全体 Agent 共享规范

所有会话（调度/规划/开发/测试/审查/安全/调研）必须遵守本文件。Copilot 侧还有一份始终加载的 `.github/copilot-instructions.md`，与本文件共同构成项目规范。

## 1. 协作协议（Agent 间通信总线）

所有跨会话沟通通过**文件**进行，禁止依赖聊天窗口记忆：

```
docs/
├── api/              # API 契约（OpenAPI 片段 / 接口文档，契约先行）
├── tasks/            # 任务卡（调度者创建，其他人更新状态）
│   ├── T001-用户登录接口.md
│   └── ...
├── handoffs/         # 交接单（开发→测试、测试→审查）
├── reports/          # 测试报告、审查报告、安全审查报告
├── decisions/        # 技术决策记录（ADR），冲突仲裁结果记录于此
└── memory/           # 项目知识库（架构/概览等稳定事实，随仓库版本化）
```

状态流转写在任务卡的 `状态` 字段：`TODO → IN_PROGRESS → DEV_DONE → TESTING → REVIEW → DONE` 或 `BLOCKED`。

## 2. 技术栈基线

| 层 | 技术 | 版本基线 |
|----|------|---------|
| Python 后端 | Python + FastAPI + SQLAlchemy 2.0 + Pydantic v2 | Python ≥ 3.11 |
| Java 后端 | Spring Boot 3 + Spring Security + MyBatis-Plus/JPA | Java ≥ 17 |
| 前端 | React 18 + TypeScript + Vite + Material UI v5 + Tailwind CSS v3 | Node ≥ 20 |
| 数据库 | PostgreSQL 15（主）/ Redis 7（缓存） | — |
| 测试 | pytest / JUnit 5 / Vitest + Testing Library / Playwright | — |

## 3. 通用工程规范

- **语言**：代码、注释、commit message 用英文；文档、任务卡用中文。
- **分支模型**：`main` 受保护；每个任务卡一个分支 `feat/Txxx-短描述`。
- **Commit**：Conventional Commits（`feat:` `fix:` `test:` `refactor:` `docs:`），commit message 尾部带上任务卡号，如 `feat: add login endpoint (T001)`。
- **配置**：一律走环境变量 + `.env.example` 提交模板；**禁止提交任何密钥**。
- **API 契约优先**：后端先在 `docs/api/` 写 OpenAPI/接口定义并让调度者确认，再写实现；前端按契约开发。
- **不做超出任务卡范围的改动**；发现相邻问题 → 新建任务卡交调度者。

## 4. 目录结构

见 `agent-team/templates/project-structure.md`。新文件必须落在对应模块目录内。

## 5. Copilot 自定义能力（本仓库内置）

| 能力 | 位置 | 说明 |
|------|------|------|
| Agent（子代理） | `.github/agents/*.agent.md` | 选择 `orchestrator`，按需委派 `planner/developer/tester/reviewer/security-auditor/researcher` |
| Skill（技能） | `.github/skills/*/SKILL.md` | 按任务相关性自动加载，含技术栈与流程规范 |
| Tool（工具/MCP） | `.mcp.json` + `tools/taskboard-mcp/` | 本地 `taskboard` 服务器读写任务卡 |
| Hooks（钩子） | `.github/hooks/*.json` | 安全护栏 / 上下文注入 / 编辑后自动格式化 |
| Memory（记忆） | `.github/copilot-instructions.md` + `docs/memory/` | 始终加载的项目说明 + 版本化知识库 |

详见 `docs/agent-capabilities.md`。

## 6. 完成定义（Definition of Done）

一个任务卡只有同时满足以下条件才算 DONE：

1. 代码实现完成，linter/type-check 通过（ruff + mypy / Checkstyle + ESLint + tsc）；
2. 单元测试覆盖核心路径，测试全部通过；
3. 通过审查者 Review，无 Critical/Major 未解决项；
4. 任务卡状态更新为 `DONE`，交接单归档。
