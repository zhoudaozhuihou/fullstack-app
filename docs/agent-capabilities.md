# Agent 自定义能力总览

本仓库内置 VS Code Copilot 的五大自定义能力：Agent / Skill / Tool / Hooks / Memory。本文说明它们的位置与扩展方式。

## 能力总览

| 能力 | 位置 | 作用 | 何时扩展 |
|------|------|------|---------|
| **Agent** | `.github/agents/*.agent.md` | 带独立指令/工具/模型的角色化子代理 | 新增角色或收窄某角色的工具 |
| **Skill** | `.github/skills/*/SKILL.md` | 按相关性自动加载的任务化能力 | 沉淀可复用的技术栈/流程规范 |
| **Tool** | `.vscode/mcp.json` + `tools/` | MCP 服务器提供额外工具 | 需要程序化读写仓库状态 |
| **Hooks** | `.github/hooks/*.json` | 生命周期钩子（护栏/上下文/门禁） | 需要强制校验或自动注入 |
| **Memory** | `.github/copilot-instructions.md` + `docs/memory/` | 始终加载的项目说明 + 版本化知识库 | 沉淀稳定架构/约定 |

## 1. Agent（子代理）

- 文件：`.github/agents/<name>.agent.md`，YAML frontmatter + Markdown 指令。
- 内置 7 个：`orchestrator`（调度）、`planner`（契约/设计/拆卡）、`developer`、`tester`、`reviewer`、`security-auditor`、`researcher`。
- frontmatter 关键字段：`name`、`description`、`tools`、`agents`（可委派的子代理）、`model`、`user-invocable`、`disable-model-invocation`。
- 用法：在 Copilot Chat 的 Agent 选择器选 `orchestrator`，由其按需委派。

### 新增 Agent

```markdown
---
name: my-agent
description: 一句话说明何时使用
tools: [read, edit, search, execute]
user-invocable: false
agents: []
---
你的指令正文……
```

## 2. Skill（技能）

- 文件：`.github/skills/<name>/SKILL.md`，目录名必须与 frontmatter `name` 一致（小写 kebab-case）。
- frontmatter：`name`、`description`（含"何时使用"）、`argument-hint`、`user-invocable`、`disable-model-invocation`、`context`（`fork` 时在子代理上下文运行）。
- 内置 10 个：`python-fastapi`、`springboot`、`react-mui-tailwind`、`testing`、`review`、`git-workflow`、`api-contract`、`database-migrations`、`debugging`、`docker-deploy`。
- 可在技能目录内放脚本/模板，并在 SKILL.md 中用相对路径引用。

### 新增 Skill

```markdown
---
name: my-skill
description: 做什么 + 何时使用
---
# 指令正文……
```

## 3. Tool（MCP 服务器）

- 工作区配置：`.vscode/mcp.json`。
- 内置：`taskboard`（本地零依赖服务器 `tools/taskboard-mcp/server.mjs`，读写 `docs/tasks/` 任务卡）。
- 也可用 `~/Library/Application Support/Code/User/mcp.json`（个人）配置全局服务器。

### 可选外部 MCP 服务器（需联网安装）

把以下条目加入 `.vscode/mcp.json` 的 `servers`（按需启用）：

```json
{
  "servers": {
    "context7": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp"]
    },
    "playwright": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@playwright/mcp@latest"]
    }
  }
}
```

- `context7`：按需拉取框架最新文档（FastAPI / Spring / React 等）。
- `playwright`：浏览器自动化，支撑 E2E 测试与页面调试。

> 外部服务器会执行 `npx` 并联网，首次运行会拉取依赖；在企业环境或离线环境请评审后再启用。

## 4. Hooks（钩子）

- 文件：`.github/hooks/*.json`，每个文件一个 `hooks` 事件映射。
- 内置 3 个：`security.json`（PreToolUse 护栏）、`context.json`（SessionStart 注入上下文）、`quality.json`（PostToolUse 质量提醒）。
- 脚本：`.github/hooks/scripts/*.mjs`（Node，跨平台）。
- 可用事件：`SessionStart`、`UserPromptSubmit`、`PreToolUse`、`PostToolUse`、`Stop`、`SubagentStart`、`SubagentStop`、`PreCompact`、`Notification`。

### 钩子约定

- stdin 收 JSON，stdout 写 JSON 控制；退出码 `0` 成功、`2` 阻塞、其他非阻塞警告。
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
# 校验 hook 脚本
echo '{"tool_name":"Bash","tool_input":{"command":"rm -rf /usr"}}' | node .github/hooks/scripts/guard-tools.mjs

# 校验 MCP 服务器
printf '%s\n' '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"cli","version":"0"}}}' '{"jsonrpc":"2.0","id":2,"method":"tools/list"}' | node tools/taskboard-mcp/server.mjs
```
