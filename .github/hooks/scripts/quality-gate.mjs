#!/usr/bin/env node
/**
 * PostToolUse 质量门禁：编辑代码后，追加"运行对应校验"的提醒（非阻塞）。
 * 输出：hookSpecificOutput.additionalContext。
 */
const input = await readStdin();
const payload = safeParse(input);
const name = String(payload.tool_name || '').toLowerCase();

if (!/(edit|write|patch|apply)/.test(name)) {
  process.exit(0);
}

const p = extractPath(payload.tool_input) || '文件';
const ext = p.toLowerCase().split('.').pop();
const checks = {
  py: 'ruff check <file> && mypy <file> && pytest',
  ts: 'npx tsc --noEmit',
  tsx: 'npx tsc --noEmit && npm run lint',
  js: 'npm run lint',
  jsx: 'npm run lint',
  java: 'mvn -q -DskipTests compile',
};
const cmd = checks[ext];
if (!cmd) {
  process.exit(0); // 非代码文件不提醒
}

process.stdout.write(
  JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'PostToolUse',
      additionalContext: `已编辑 ${p}。请在交付前运行对应校验：${cmd}（及相关测试），并遵守 AGENTS.md 的完成定义。`,
    },
  }),
);
process.exit(0);

// ---------------------------------------------------------------------------

function extractPath(toolInput) {
  const t = toolInput && typeof toolInput === 'object' ? toolInput : {};
  for (const k of ['file_path', 'filePath', 'path', 'target_file', 'absolutePath']) {
    const v = t[k];
    if (typeof v === 'string') return v;
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
