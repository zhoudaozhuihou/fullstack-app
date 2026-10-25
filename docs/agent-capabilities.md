# Agent 自定义能力总览

本仓库内置 VS Code Copilot 的五大自定义能力：Agent / Skill / Tool / Hooks / Memory。本文说明它们的位置、在 **Copilot harness** 下的行为，以及扩展方式。

> 说明：VS Code 有多个 harness（Copilot / Local / Claude / Codex），同一份文件的字段在各自 harness 下行为可能不同。本仓库以 **Copilot harness（VS Code Agent Window 默认）** 为准，并标注 Local 差异。

## 能力总览

| 能力 | 位置 | 在 Copilot harness 下的状态 |
|------|------|---------------------------|
| **Agent** | `.github/agents/*.agent.md` | ✅ 可用；`name/description/user-invocable` 通用 |
| **Skill** | `.github/skills/*/SKILL.md` | ✅ 可用，按需自动加载 |
| **Tool** | `.mcp.json` + `tools/` | ✅ 可用（读工作区根 `.mcp.json` 的 `mcpServers`） |
| **Hooks** | `.github/hooks/*.json` | ✅ 可用（`bash/powershell/timeoutSec` 格式） |
| **Memory** | `.github/copilot-instructions.md` + `docs/memory/` | ✅ 可用（`copilot-instructions.md` 是官方项目指令文件） |

## 1. Agent（子代理）

- 文件：`.github/agents/<name>.agent.md`，YAML frontmatter + Markdown 指令。
- 内置 7 个：`orchestrator`、`planner`、`developer`、`tester`、`reviewer`、`security-auditor`、`researcher`。
- 在 Copilot harness 下**确定可用**的 frontmatter 字段：`name`、`description`、`user-invocable`、`disable-model-invocation`、`model`、`reasoning-effort`。

### 作用域（workspace vs user）

| 作用域 | 位置 | 何时可见 |
|--------|------|---------|
| 工作区级 | `.github/agents/` | 仅打开本仓库时 |
| 用户级 | `~/.copilot/agents/` | 任意项目 |

把 agent 安装到用户级（跨项目全局可用）：

```bash
node scripts/sync-copilot-user.mjs              # 同步 agents + skills 到 ~/.copilot/
node scripts/sync-copilot-user.mjs --uninstall  # 卸载
```

仓库 `.github/agents` 与 `.github/skills` 是唯一源；更新后重跑脚本同步。

### Copilot 与 Local 的差异（重点）

| 字段 | Local harness | Copilot harness |
|------|--------------|----------------|
| `tools: [...]` | 用 VS Code 工具名（`read`/`search`/`edit`…） | 用**自己的工具名**；未知工具名会被忽略。故本仓库仅在只读代理（`researcher`/`security-auditor`）用最稳的 `[read, search]`，其余代理**不写 `tools`**，继承默认工具 |
| `agents: [...]`（子代理白名单） | 生效 | **不生效**；Copilot 用原生 `task` 工具委派，靠指令正文描述委派关系 |
| `tools: [agent]`（工具集） | 生效 | 已弃用/不支持，故本仓库已移除 |

因此 `orchestrator` 的委派行为在 Copilot 下由**正文指令** + Copilot 原生子代理机制实现，而非 `agents:` 字段。

### 新增 Agent

```markdown
---
name: my-agent
description: 一句话说明何时使用
user-invocable: false
---
你的指令正文……（需要限制工具时，用只读代理的 `tools: [read, search]` 或 Local 的具体工具名）
```

## 2. Skill（技能）

- 文件：`.github/skills/<name>/SKILL.md`，目录名必须与 frontmatter `name` 一致（小写 kebab-case）。
- frontmatter：`name`、`description`（含"何时使用"）、`argument-hint`、`user-invocable`、`disable-model-invocation`、`context`。
- 内置 10 个：`python-fastapi`、`springboot`、`react-mui-tailwind`、`testing`、`review`、`git-workflow`、`api-contract`、`database-migrations`、`debugging`、`docker-deploy`。
- 可在技能目录内放脚本/模板，并在 SKILL.md 中用相对路径引用。

## 3. Tool（MCP 服务器）

- **Copilot harness 读工作区根 `.mcp.json`（便携格式，顶层 `mcpServers`）**；`.vscode/mcp.json` 是 VS Code/Local 格式，Copilot 不直接读取。
- 内置 `taskboard`：本地零依赖服务器 `tools/taskboard-mcp/server.mjs`，读写 `docs/tasks/` 任务卡。

```json
{
  "mcpServers": {
    "taskboard": {
      "command": "node",
      "args": ["tools/taskboard-mcp/server.mjs"]
    }
  }
}
```

### 可选外部 MCP 服务器（需联网安装）

```json
{
  "mcpServers": {
    "context7": {
      "type": "http",
      "url": "https://mcp.context7.com/mcp"
    },
    "playwright": {
      "command": "npx",
      "args": ["-y", "@playwright/mcp@latest"]
    }
  }
}
```

- `context7`：按需拉取框架最新文档（FastAPI / Spring / React 等）。
- `playwright`：浏览器自动化，支撑 E2E 测试与页面调试。

> 外部服务器会联网/拉依赖；企业或离线环境请评审后再启用。

## 4. Hooks（钩子）

- 文件：`.github/hooks/*.json`，Copilot 格式 `{ "version": 1, "hooks": { "<事件>": [...] } }`。
- 一个 command 条目用 `bash`/`powershell`（非 Local 的 `command`）+ `timeoutSec`。
- 脚本从 stdin 读 JSON（`toolName` / `toolArgs` JSON 字符串），按事件写 stdout 或做副作用。
- 内置 3 个：`security.json`（preToolUse 拦截）、`context.json`（sessionStart 注入上下文）、`quality.json`（postToolUse 自动格式化）。
- 详见 `.github/hooks/README.md`。

## 5. Memory（记忆）

三层模型：

| 层 | 位置 | 生命周期 |
|----|------|---------|
| 项目说明（始终加载） | `.github/copilot-instructions.md` + `AGENTS.md` | 随仓库 |
| 项目知识库（按需读取） | `docs/memory/*.md` | 随仓库 |
| 本地 memory 工具 | VS Code 本地 `/memories/`（不入库） | 个人/会话 |

详见 `docs/memory/README.md`。

## 快速验证

```bash
# 校验 hook 脚本（Copilot payload 契约）
echo '{"toolName":"bash","toolArgs":"{\"command\":\"rm -rf /usr\"}"}' | node .github/hooks/scripts/guard-tools.mjs

# 校验 MCP 服务器（自定位仓库根）
printf '%s\n' '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"cli","version":"0"}}}' '{"jsonrpc":"2.0","id":2,"method":"tools/list"}' | node tools/taskboard-mcp/server.mjs
```

## 参考

- [Custom agent file reference](https://code.visualstudio.com/docs/agents/reference/custom-agent-file-reference)
- [Agent Skills](https://code.visualstudio.com/docs/agent-customization/agent-skills)
- [MCP configuration reference](https://code.visualstudio.com/docs/agents/reference/mcp-configuration)
- [GitHub Copilot hooks reference](https://docs.github.com/en/copilot/reference/hooks-reference)
- [Custom instructions](https://code.visualstudio.com/docs/agent-customization/custom-instructions)
