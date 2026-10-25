# taskboard-mcp

零依赖的本地 MCP (Model Context Protocol) 服务器，让 VS Code Copilot 通过**工具调用**读写 `docs/tasks/` 下的任务卡，作为 Agent 间文件总线的程序化入口。

## 依赖

仅 Node.js ≥ 18（仓库技术栈基线为 Node ≥ 20），**无需 `npm install`**。

## 暴露的工具

| 工具 | 用途 |
|------|------|
| `list_tasks` | 列出全部任务卡（可按状态过滤），返回 id/标题/状态/负责人/优先级/依赖/分支/路径 |
| `get_task` | 读取单张任务卡完整内容 |
| `create_task` | 按模板新建任务卡 `docs/tasks/T<id>-<slug>.md`（不覆盖已存在） |
| `update_task` | 更新状态 / 负责人 / 优先级（仅改对应字段行） |

## 本地验证

```bash
# 用标准输入喂 JSON-RPC 消息即可验证（按顺序回车发送）
printf '%s\n' \
  '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"cli","version":"0"}}}' \
  '{"jsonrpc":"2.0","method":"notifications/initialized"}' \
  '{"jsonrpc":"2.0","id":2,"method":"tools/list"}' \
  '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"list_tasks","arguments":{}}}' \
  | node tools/taskboard-mcp/server.mjs
```

## 在 VS Code 中使用

已在 `.vscode/mcp.json` 中注册为 `taskboard` 服务器，Copilot 会在需要时自动调用。

如需独立测试，可手动配置任意 MCP 客户端：

```json
{
  "servers": {
    "taskboard": {
      "type": "stdio",
      "command": "node",
      "args": ["tools/taskboard-mcp/server.mjs"]
    }
  }
}
```

## 约定

- 任务卡格式遵循 `agent-team/templates/task-card.md`（`- 状态:` / `- 负责人:` / `- 优先级:` / `- 依赖:` 字段行）。
- 文件命名 `T<id>-<slug>.md`，与 `AGENTS.md` 的 `docs/tasks/Txxx-*.md` 约定一致。
