#!/usr/bin/env node
/**
 * PreToolUse 安全护栏：拦截危险命令、受保护文件写入、疑似密钥写入。
 * 输入：stdin 一行 JSON（含 tool_name / tool_input）。
 * 输出：命中时 stdout 写 deny 决策；否则静默（exit 0）。
 */
const input = await readStdin();
const payload = safeParse(input);
const reason = inspect(payload.tool_name, payload.tool_input);

if (reason) {
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'deny',
        permissionDecisionReason: reason,
      },
    }),
  );
}
process.exit(0);

// ---------------------------------------------------------------------------

function inspect(toolName, toolInput) {
  const name = String(toolName || '').toLowerCase();
  const blob = toolInput == null ? '' : JSON.stringify(toolInput);

  // 1) 危险 shell 命令
  if (/(bash|terminal|execute|shell|run)/.test(name) || looksLikeCommand(toolInput)) {
    const r = dangerousCommand(blob);
    if (r) return r;
  }

  // 2) 受保护文件写入
  if (/(write|edit|patch|apply)/.test(name)) {
    const p = extractPath(toolInput);
    if (p && protectedPath(p)) {
      return `已拦截对受保护文件的修改: ${p}（请改 .env.example 或走正规评审流程）`;
    }
    const s = secretIn(blob);
    if (s) {
      return `疑似密钥/敏感信息写入被拦截 (${s})。请使用环境变量 + .env.example，密钥不得入库。`;
    }
  }
  return null;
}

function looksLikeCommand(toolInput) {
  const t = toolInput && typeof toolInput === 'object' ? toolInput : {};
  return (
    t.command !== undefined ||
    t.cmd !== undefined ||
    t.command_line !== undefined ||
    t.arguments !== undefined
  );
}

/** 危险命令匹配：返回拦截原因，否则 null。 */
function dangerousCommand(blob) {
  const rules = [
    { re: /\brm\s+(-\S*rf\S*|-\S*fr\S*)\b[^;\n]*(?:\/\*|\s\/|\s~|\/usr|\/var|\/etc|\s--no-preserve-root)/, why: '递归删除根/系统/家目录（rm -rf 危险路径）' },
    { re: /git\s+push\b[^\n]*(?:--force|-f)\b/, why: 'git push --force 强推（可能覆盖远端历史）' },
    { re: /git\s+reset\s+--hard\b/, why: 'git reset --hard 会丢弃未提交改动' },
    { re: /\b(DROP\s+TABLE|DROP\s+DATABASE|TRUNCATE\s+TABLE)\b/i, why: '破坏性 SQL（DROP/TRUNCATE）' },
    { re: /:\s*\(\s*\)\s*\{?\s*:\s*\|:\s*&\s*\}/, why: 'fork bomb' },
    { re: /\bdd\b[^\n]*of=\/dev\//, why: 'dd 写入 /dev 设备' },
    { re: /\bmkfs\b/, why: '格式化文件系统（mkfs）' },
    { re: /(?:curl|wget)\b[^\n|;]*\|\s*(?:sudo\s+)?(?:ba)?sh\b/, why: 'curl/wget 管道到 shell（远程代码执行）' },
    { re: /chmod\s+-R\s+777\s+\//, why: 'chmod -R 777 / 破坏权限' },
    { re: /chown\s+-R\b[^\n]*\s+\//, why: 'chown -R 到根目录' },
    { re: /\b(shutdown|reboot|poweroff|init\s+0)\b/, why: '关机/重启命令' },
  ];
  for (const r of rules) {
    if (r.re.test(blob)) return r.why;
  }
  return null;
}

/** 疑似密钥模式：命中返回类型，否则 null。 */
function secretIn(blob) {
  const rules = [
    { re: /-----BEGIN\s+(RSA\s+|EC\s+|OPENSSH\s+|PGP\s+)?PRIVATE\s+KEY( BLOCK)?-----/, why: '私钥块' },
    { re: /\bAKIA[0-9A-Z]{16}\b/, why: 'AWS Access Key' },
    { re: /\bghp_[A-Za-z0-9]{36}\b/, why: 'GitHub Personal Access Token' },
    { re: /\bgithub_pat_[A-Za-z0-9_]{20,}\b/, why: 'GitHub fine-grained PAT' },
    { re: /\bsk-[A-Za-z0-9]{32,}\b/, why: 'OpenAI 类 API Key' },
    { re: /\bxox[bap]-[A-Za-z0-9-]{10,}\b/, why: 'Slack Token' },
    { re: /\bAIza[0-9A-Za-z_-]{35}\b/, why: 'Google API Key' },
  ];
  for (const r of rules) {
    if (r.re.test(blob)) return r.why;
  }
  return null;
}

function extractPath(toolInput) {
  const t = toolInput && typeof toolInput === 'object' ? toolInput : {};
  for (const k of ['file_path', 'filePath', 'path', 'target_file', 'absolutePath', 'uri']) {
    const v = t[k];
    if (typeof v === 'string') return v;
  }
  return null;
}

function protectedPath(p) {
  const base = String(p).split(/[?#]/)[0];
  const name = base.split('/').pop();
  const lower = name.toLowerCase();
  if (lower === '.env' || lower === '.env.production' || lower === '.env.local') return true;
  if (/\.(pem|key|p12|pfx|jks|keystore)$/i.test(name)) return true;
  if (/\/\.git(\/|$)/.test(base) || lower === '.git') return true;
  return false;
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
