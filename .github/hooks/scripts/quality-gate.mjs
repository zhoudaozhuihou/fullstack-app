#!/usr/bin/env node
/**
 * postToolUse 质量门禁（Copilot harness 契约）。
 * 注意：Copilot 下 postToolUse 的 stdout 会被忽略，因此这里用「副作用」方式
 * —— 对成功编辑的代码文件 best-effort 运行 formatter（ruff / eslint --fix）。
 * 无对应工具或非代码文件则静默跳过。
 */
import { execSync } from 'node:child_process';
import { promises as fs } from 'node:fs';
import path from 'node:path';

const input = await readStdin();
const payload = safeParse(input);
const name = String(payload.toolName || '').toLowerCase();
const args = parseToolArgs(payload.toolArgs);

// 只在文件写入类工具成功后处理
if (!/(edit|create|write|patch|apply)/.test(name)) process.exit(0);
const resultType = payload.toolResult?.resultType ?? 'success';
if (resultType !== 'success') process.exit(0);

const file = extractPath(args);
if (!file) process.exit(0);
const abs = path.resolve(payload.cwd || process.cwd(), file);
const ext = path.extname(abs).toLowerCase();

const formatters = {
  '.py': 'ruff format',
  '.js': 'npx eslint --fix',
  '.jsx': 'npx eslint --fix',
  '.ts': 'npx eslint --fix',
  '.tsx': 'npx eslint --fix',
};
const fmt = formatters[ext];
if (!fmt) process.exit(0);

// best-effort：文件存在且工具可用才执行，失败静默跳过
try {
  await fs.access(abs);
  execSync(`${fmt} "${abs}"`, {
    cwd: payload.cwd || process.cwd(),
    stdio: 'ignore',
    timeout: 12000,
  });
} catch {
  /* 忽略：工具未安装或文件缺失 */
}
process.exit(0);

// ---------------------------------------------------------------------------

function parseToolArgs(toolArgs) {
  if (toolArgs == null) return {};
  if (typeof toolArgs === 'string') {
    try {
      return JSON.parse(toolArgs);
    } catch {
      return { raw: toolArgs };
    }
  }
  return toolArgs;
}

function extractPath(args) {
  for (const k of ['path', 'file_path', 'filePath', 'target_file', 'absolutePath']) {
    const v = args[k];
    if (typeof v === 'string' && v) return v;
  }
  return null;
}

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
