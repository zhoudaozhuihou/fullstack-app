# 推荐 Monorepo 项目结构

```
project-root/
├── AGENTS.md                    # 全体 Agent 共享规范
├── .github/
│   ├── copilot-instructions.md  # 始终加载的项目说明（Memory 层）
│   ├── agents/                  # 自定义子代理（orchestrator/planner/developer/...）
│   ├── skills/                  # 技能（python-fastapi/springboot/react/...）
│   ├── hooks/                   # 生命周期钩子（security/context/quality）
│   │   └── scripts/             # 钩子脚本（Node，跨平台）
│   └── workflows/               # CI：lint + test 三服务并行
├── docs/
│   ├── api/                     # API 契约（OpenAPI 片段 / 接口文档）
│   ├── tasks/                   # 任务卡（Agent 通信总线）
│   ├── handoffs/                # 交接单
│   ├── reports/                 # 测试报告 / 审查报告 / 安全审查报告
│   ├── decisions/               # ADR 技术决策记录
│   └── memory/                  # 项目知识库（概览/架构等稳定事实）
├── tools/
│   └── taskboard-mcp/           # 本地 MCP 服务器（读写任务卡）
├── .mcp.json                    # MCP 服务器配置（Copilot 便携格式）
├── .vscode/
│   └── settings.json            # Copilot 相关设置
├── agent-team/                  # 手动多会话协作包（roles/ templates/）
├── backend-py/                  # FastAPI 服务（skills/python-fastapi）
│   ├── app/…  ├── tests/  ├── pyproject.toml  ├── .env.example
├── backend-java/                # Spring Boot 服务（skills/springboot）
│   ├── src/main/…  ├── src/test/…  ├── pom.xml
├── frontend/                    # React + MUI + Tailwind（skills/react-mui-tailwind）
│   ├── src/…  ├── package.json  ├── tailwind.config.js
└── deploy/                      # docker-compose.yml、各服务 Dockerfile
```

## 服务间关系约定

- 前端默认对接 FastAPI（`VITE_API_BASE_URL`）；Spring Boot 承担独立领域（如报表/批处理）时通过网关或直接域名对接。
- 两后端共享的用户/鉴权：优先由 FastAPI 签发 JWT，Spring Boot 只做校验（共享 secret/JWKS），避免双账号体系。
- 本地编排：`deploy/docker-compose.yml` 一键起 postgres + redis + 三个服务。

## CI 建议（.github/workflows/ci.yml）

三个独立 job 并行：
1. `backend-py`: ruff + mypy + pytest
2. `backend-java`: mvn verify
3. `frontend`: lint + tsc + vitest + build

## Copilot 自定义能力

- Agent：`.github/agents/*.agent.md`；Skill：`.github/skills/*/SKILL.md`；Tool：`.mcp.json` + `tools/`；Hooks：`.github/hooks/*.json`；Memory：`.github/copilot-instructions.md` + `docs/memory/`。
- 详见 `docs/agent-capabilities.md`。
