# 在 VS Code Agent Window 中使用本模板

本文只讲**操作**：如何把这个目录接入 VS Code Agent Window 开始开发，以及如何启动多个 session 进行同步/并行开发。不涉及具体业务功能示例。

> 术语：**Agent Window**（Agents 窗口）是 VS Code 专门运行/编排 Agent 的独立窗口；**session（会话）** = 一个工作区 + 代码改动 + 一个或多个聊天的工作单元。

## 前置条件

- VS Code 已安装，并**登录 GitHub Copilot**（设置 → 登录；需 Copilot 订阅）。
- 推荐 VS Code Insiders（部分能力为 Preview）。
- 本地已 `git`、并能运行项目所需工具（Node ≥ 20，Python ≥ 3.11，Java ≥ 17，Docker 可选）。

## 1. 把目录接入 Agent Window（首次）

### 1.1 克隆并打开目录

```bash
git clone git@github.com:zhoudaozhuihou/fullstack-app.git
cd fullstack-app
code .            # 在主编辑器窗口打开该目录作为工作区
```

> 关键点：`.github/agents/`、`.github/skills/`、`.github/hooks/`、`.github/copilot-instructions.md` 位于**工作区根目录**，VS Code 会自动发现并加载它们——无需手动"引入"。

### 1.2 打开 Agents Window

任选其一：

- 点击主窗口**标题栏的 "Open in Agents" 按钮**；
- 命令面板（`⇧⌘P` / `Ctrl+Shift+P`）执行 **Chat: Open Agents window**；
- 终端执行 `code --agents`。

### 1.3 新建第一个会话（接入该目录）

在 Agents Window 里：

1. 点左侧侧边栏顶部的 **New**（或悬停到该工作区上的 **+**）。
2. 选 **Folder**（本地目录），选 `fullstack-app` 作为主执行工作区（Agent 在这里运行和改文件）。
3. **Session Target** 选 **Copilot**（harness）。
4. 在 Agent 选择器里选 `orchestrator`（本仓库的调度者），或先用内置默认 agent 试用。
5. 输入需求 prompt，回车提交。

完成后，Agent 会自动读取 `AGENTS.md`、`.github/copilot-instructions.md`，并按需加载 `.github/skills/` 与 `.github/agents/`。

### 1.4 验证接入成功

在会话里直接问：

```text
列出这个工作区可用的自定义 Agent、技能和钩子。
```

- 能列出 7 个 Agent（`orchestrator/planner/developer/tester/reviewer/security-auditor/researcher`）与 10 个技能 → 接入成功。
- 若看不到：确认目录为工作区根、Copilot 已登录、VS Code 版本足够新。

---

## 2. 三种使用模式

| 模式 | 适用场景 | 是否并行 | 关键机制 |
|------|---------|---------|---------|
| **A. 单会话子代理** | 一个需求，交给 `orchestrator` 拆解并委派 | 否（内部串行） | 子代理 + 文件总线 |
| **B. 多 session 并行独立任务** | 两个互不相关的任务同时做 | ✅ 真并行 | 每个 session 一个 **Git worktree** |
| **C. 多 session 角色团队** | 团队流水线（调度/开发/测试/审查） | 部分（仅不冲突文件） | 每角色一个 session + `docs/` 文件总线 |

下面分别给出步骤。

### 模式 A：单会话子代理（默认，最简单）

1. 新建会话，选 `orchestrator`。
2. 一句自然语言需求即可，例如：

```text
给 backend-py 增加 POST /api/v1/auth/login，契约已在 docs/api/auth.md，请按 AGENTS.md 流程完成。
```

3. `orchestrator` 会自动委派 `planner → developer → tester → reviewer → security-auditor`，并把状态写入 `docs/tasks/`、报告写入 `docs/reports/`。

### 模式 B：多 session 并行独立任务（真并行）

> 核心原则：并行任务必须**文件不冲突**，且各自用**独立 worktree** 隔离改动。参考 VS Code 官方指南 [Delegate two tasks without mixing their changes](https://code.visualstudio.com/docs/agents/guides/delegate-two-tasks)。

**步骤：**

1. **准备干净基线**：在主工作区把共享改动先提交，确保 `git status --short` 无输出。
2. **建集成分支**：`git checkout -b integrate-agent-tasks`（两个任务都从它派生）。
3. **开会话 A**：Agents Window → **New** → 选 `fullstack-app` → **Copilot** → 勾选 **New Worktree** → 基线选 `integrate-agent-tasks` → 输入任务 A 的 prompt。
4. **开会话 B**：按住 `Alt`（macOS `Option`）再点 **New**（保持 A 可见），同样 **New Worktree**、同基线分支，输入任务 B 的 prompt。

> prompt 建议写清：目标、允许改动的文件、验收标准、禁止改动范围、验证命令、不要提交/推送。

5. **监控**：左侧 sessions list 看两个会话状态；可拖拽会话排列成**网格**并排查看（拖动到另一个会话的上/下/左/右边缘形成分屏）。
6. **各自审查**：分别点会话 → **Changes** 看 diff，验收通过后 **Commit Changes**。
7. **合并**：回主工作区确认在 `integrate-agent-tasks` 分支；在会话 A → **Changes → Branch Changes → Merge Changes**，再对 B 重复；合并后重跑两侧测试。

> 隔离说明：worktree 隔离的是**工作文件**，不是权限；worktree 会话默认 **Allow all**，请只在可信仓库用。需要人工审批时用 Folder 会话逐个跑。

### 模式 C：多 session 角色团队（本仓库的 manual 协作模式）

本仓库 `agent-team/roles/` 提供了 4 个角色提示词，可各自开一个 session 组成团队，通过 `docs/` 文件总线协作。

**步骤：**

1. 开一个**调度者 session**：新建会话，选 `orchestrator`（或选内置 agent 并粘贴 [`agent-team/roles/01-orchestrator.md`](../agent-team/roles/01-orchestrator.md) 全文作为首条提示）。
2. 让调度者把需求拆成任务卡写入 `docs/tasks/`，并指定负责人与依赖。
3. 为每个执行角色开**独立 session**（`Alt/Option + New`），分别以对应角色提示词作为首条提示：
   - 开发者：粘贴 [`roles/02-developer.md`](../agent-team/roles/02-developer.md)
   - 测试者：粘贴 [`roles/03-tester.md`](../agent-team/roles/03-tester.md)
   - 审查者：粘贴 [`roles/04-reviewer.md`](../agent-team/roles/04-reviewer.md)
4. 各角色读取 `docs/tasks/`、`docs/handoffs/`、`docs/reports/` 协作，按 `TODO → IN_PROGRESS → DEV_DONE → TESTING → REVIEW → DONE` 流转。

> 并行边界：角色团队是**流水线**——开发→测试→审查按序走；只有**文件不重叠**的任务才能同时派给多个开发者。共享工作区中不要让两个会话同时改同一文件。

---

## 3. 监控与协调多个会话

- **会话列表**：左侧 sidebar，按工作区分组；可自定义分组、置顶（pin）、归档（Mark as Done）。
- **并排/网格**：`Alt/Option + 点会话`、右键 **Open to the Side**、或拖拽到会话边缘分屏；会话头部 **Session Layout → Arrange Sessions in a Balanced Grid**。
- **一个会话内多聊天**：右键会话 → **New Chat in This Session**（peer chat），用于相关但不打断主线的工作。
- **分叉**：输入 `/fork` 分叉当前会话探索备选方案；`/fork prompt <描述>` 分叉并立即发送。
- **跨会话协作**：在 Copilot 会话里可直接用自然语言让 Agent 创建独立会话/聊天，例如：

```text
Create an independent session in the fullstack-app workspace with a new worktree to implement the login endpoint.
```

- 会话间发消息、Agent 创建新会话均需你确认；跨会话扩散有上限保护。

---

## 4. 常见问题

**Q：看不到自定义 Agent / 技能？**
确认目录是工作区根、Copilot 已登录、VS Code 较新；技能需在 `.github/skills/` 且 `SKILL.md` 的 `name` 与目录名一致。

**Q：两个并行会话改同一个文件冲突了？**
用 worktree 隔离（模式 B），或确保任务文件范围互不重叠；冲突后用 **Merge Changes** 逐个合并并重测。

**Q：worktree 会话没有我未提交的改动？**
worktree 只含基线分支的已提交内容；未提交改动与 `.gitignore` 文件默认不复制。先把 Agent 需要的改动提交。

**Q：如何让 Agent 只读、不自动改文件？**
新建会话时选权限级别；或让 `researcher`（只读代理）调研；在 prompt 里写"不要修改文件/不要提交"。

**Q：任务做完了如何收尾？**
审查 → **Commit Changes** → 需要时 **Create PR** → 在会话上 **Mark as Done**（不要删除含未合并改动的会话）。
