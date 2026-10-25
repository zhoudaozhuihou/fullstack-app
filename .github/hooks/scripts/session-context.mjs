#!/usr/bin/env node
/**
 * sessionStart 上下文注入（Copilot harness 契约）。
 * 输入：stdin 一行 JSON，字段含 cwd / source / initialPrompt。
 * 输出：顶层 {"additionalContext":"..."}，注入会话上下文。
 */
import { execSync } from 'node:child_process';

const input = await readStdin();
const payload = safeParse(input);
const cwd = payload.cwd || process.cwd();

let branch = '';
let commits = [];
const gitOpts = { cwd, encoding: 'utf8', timeout: 3000, stdio: ['ignore', 'pipe', 'ignore'] };
try {
  branch = execSync('git rev-parse --abbrev-ref HEAD', gitOpts).trim();
} catch {
  /* 非 git 环境忽略 */
}
try {
  commits = execSync('git log --oneline -3', gitOpts)
    .trim()
    .split(/\r?\n/)
    .filter(Boolean);
} catch {
  /* 忽略 */
}

const lines = [
  '项目: fullstack-app（多 Agent 全栈实例 + Copilot 自定义能力模板）',
  branch ? `当前分支: ${branch}` : null,
  commits.length ? `最近提交:\n${commits.map((c) => '  ' + c).join('\n')}` : null,
  '必读: AGENTS.md、.github/copilot-instructions.md、docs/memory/project-overview.md',
  '技能目录: .github/skills/（按任务加载对应 SKILL.md）',
  '任务板工具: 可用 MCP `taskboard` 读写 docs/tasks/ 任务卡',
].filter(Boolean);

process.stdout.write(JSON.stringify({ additionalContext: lines.join('\n') }));
process.exit(0);

// ---------------------------------------------------------------------------

function safeParse(s) {
  try {
    return JSON.parse(s || '{}');
  } catch {
    return {};
  }
}

async function readStdin() {
  let data = '';
  process.stdin.setEncoding('utf8');
  for await (const chunk of process.stdin) data += chunk;
  return data;
}
