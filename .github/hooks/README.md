# Copilot Hooks（钩子）

钩子让 Agent 在生命周期的特定节点自动执行脚本，用于**加护栏、注入上下文、提醒质量门禁**，而不依赖模型主动请求。

## 位置与发现

- 仓库共享：`.github/hooks/*.json`（本目录，Copilot harness 自动发现）。
- 个人：`~/.copilot/hooks/`。
- 本仓库通过 `node <script>.mjs` 执行（跨平台，仅依赖 Node ≥ 18）。

## 现有钩子

| 文件 | 事件 | 作用 | 是否阻塞 |
|------|------|------|---------|
| `security.json` | `PreToolUse` | 拦截危险命令 / 受保护文件 / 疑似密钥写入 | ✅ 可 deny |
| `context.json` | `SessionStart` | 注入项目背景、当前分支、必读文档指针 | ❌ 仅加上下文 |
| `quality.json` | `PostToolUse` | 编辑代码后提醒运行对应 lint/type-check/test | ❌ 仅提醒 |

## 钩子脚本约定

- 每个钩子从 **stdin** 读取一行 JSON（含 `hook_event_name`、`tool_name`、`tool_input`、`cwd` 等字段）。
- 向 **stdout** 写 JSON 控制行为；退出码：`0` 成功、`2` 阻塞（stderr 给模型）、其他值非阻塞警告。
- 脚本对异常输入默认放行（exit 0），绝不因解析失败卡死会话。

### 控制输出示例

```json
// PreToolUse 拦截
{ "hookSpecificOutput": { "hookEventName": "PreToolUse", "permissionDecision": "deny", "permissionDecisionReason": "..." } }
// SessionStart / PostToolUse 追加上下文
{ "hookSpecificOutput": { "hookEventName": "SessionStart", "additionalContext": "..." } }
```

## 本地验证

```bash
echo '{"tool_name":"Bash","tool_input":{"command":"rm -rf /usr"}}' \
  | node .github/hooks/scripts/guard-tools.mjs
# 期望输出 deny 决策

echo '{"tool_name":"Edit","tool_input":{"file_path":"app/main.py"}}' \
  | node .github/hooks/scripts/quality-gate.mjs
# 期望输出 ruff 提醒
```

## 扩展

可添加更多事件：`UserPromptSubmit`（按提示注入约定）、`Stop`（要求跑完测试再停）、`SubagentStop`、`PreCompact`（压缩前保留关键上下文）、`Notification`。新建 `*.json` 放入本目录即可，脚本放 `scripts/`。

> 注意：钩子为 VS Code Preview 能力；不同 harness（Copilot / Local / Claude / Codex）事件命名与 payload 可能略有差异，跨 harness 复用前请先验证。
