# Copilot Hooks（钩子）

钩子让 Agent 在生命周期特定节点自动执行脚本，用于**加护栏、注入上下文、运行 formatter**，不依赖模型主动请求。

## 位置与格式（Copilot harness）

- 仓库共享：`.github/hooks/*.json`（本目录，Copilot 自动发现）。
- 每个 `.json` 是 `{ "version": 1, "hooks": { "<事件>": [ <hook 条目> ] } }`。
- 事件名用 camelCase（`preToolUse`/`sessionStart`/`postToolUse`…），也兼容 PascalCase。

一个 hook 条目（command hook）：

```json
{
  "type": "command",
  "bash": "node ./.github/hooks/scripts/guard-tools.mjs",
  "powershell": "node ./.github/hooks/scripts/guard-tools.mjs",
  "cwd": ".",
  "timeoutSec": 10
}
```

- `bash` / `powershell`：分别对应 Unix / Windows 的命令行；Node 脚本可两边写同一个 `node ...`。
- `matcher`（可选）：按工具名过滤（如 `"bash"`），省去脚本内过滤；本仓库脚本自带过滤，未用 matcher 以兼容各版本。
- `timeoutSec`：超时秒数，默认 30。

## 脚本契约（重要）

- **stdin**：一行 JSON；字段为 `toolName`、`toolArgs`（**JSON 字符串**，需二次 `JSON.parse`）、`cwd` 等。
- **stdout**：只有部分事件解析 stdout：
  - `preToolUse`：解析顶层 `{"permissionDecision":"deny","permissionDecisionReason":"..."}`（deny/allow/ask）。
  - `sessionStart`：解析顶层 `{"additionalContext":"..."}`，注入会话。
  - `postToolUse`：**stdout 被忽略**，应通过副作用（如运行 formatter）工作。
- **退出码**：`0` 成功继续；非 0 通常视为失败/阻断。

## 现有钩子

| 文件 | 事件 | 作用 | 机制 |
|------|------|------|------|
| `security.json` | `preToolUse` | 拦截危险命令 / 受保护文件 / 疑似密钥写入 | 结构化 deny |
| `context.json` | `sessionStart` | 注入项目背景、当前分支、必读文档指针 | additionalContext |
| `quality.json` | `postToolUse` | 对成功编辑的代码文件 best-effort 运行 formatter | 副作用（ruff / eslint --fix） |

## 本地验证

```bash
echo '{"toolName":"bash","toolArgs":"{\"command\":\"rm -rf /usr\"}"}' \
  | node .github/hooks/scripts/guard-tools.mjs
# 期望输出 {"permissionDecision":"deny",...}

echo '{"cwd":"'$PWD'","source":"new"}' \
  | node .github/hooks/scripts/session-context.mjs
# 期望输出 {"additionalContext":"..."}
```

## 可用事件

`sessionStart`、`sessionEnd`、`userPromptSubmitted`、`preToolUse`、`postToolUse`、`postToolUseFailure`、`agentStop`、`subagentStart`、`subagentStop`、`errorOccurred`、`preCompact`、`permissionRequest`。

## 扩展

新建 `*.json` 放入本目录即可，脚本放 `scripts/`。注意：钩子运行在关键路径上，应保持**同步、有界、幂等、无交互**；把"风格/流程指导"留给 skills 与 instructions，把"强制校验/护栏/副作用"留给 hooks。

> 参考：[GitHub Copilot hooks reference](https://docs.github.com/en/copilot/reference/hooks-reference)。
