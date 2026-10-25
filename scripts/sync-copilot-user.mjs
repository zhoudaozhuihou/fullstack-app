#!/usr/bin/env node
/**
 * 把本仓库的 Copilot 自定义能力（agents + skills）同步到「用户级」目录，
 * 使其在任意项目中都能被 Copilot 读取，而无需打开本仓库。
 *
 * 用法（在仓库根目录）：
 *   node scripts/sync-copilot-user.mjs              # 同步（幂等，可重复执行）
 *   node scripts/sync-copilot-user.mjs --uninstall  # 卸载（仅删除本脚本复制过的文件）
 *   node scripts/sync-copilot-user.mjs --dry-run    # 只打印将执行的动作，不落盘
 *
 * 目标目录：$COPILOT_HOME（默认 ~/.copilot）下的 agents/ 与 skills/。
 * 仓库中的 .github/agents/ 与 .github/skills/ 始终是唯一源；更新后重跑本脚本即可。
 */
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DEST = process.env.COPILOT_HOME || path.join(os.homedir(), '.copilot');

const AGENTS_SRC = path.join(ROOT, '.github', 'agents');
const SKILLS_SRC = path.join(ROOT, '.github', 'skills');
const AGENTS_DST = path.join(DEST, 'agents');
const SKILLS_DST = path.join(DEST, 'skills');

const mode = process.argv[2] || '';

async function listAgents() {
  try {
    const files = await fs.readdir(AGENTS_SRC);
    return files.filter((f) => f.endsWith('.agent.md') || f.endsWith('.md'));
  } catch {
    return [];
  }
}

async function listSkills() {
  try {
    const entries = await fs.readdir(SKILLS_SRC, { withFileTypes: true });
    return entries.filter((e) => e.isDirectory()).map((e) => e.name);
  } catch {
    return [];
  }
}

async function main() {
  const agents = await listAgents();
  const skills = await listSkills();

  if (mode === '--uninstall') {
    console.log(`从用户级目录卸载（${DEST}）：`);
    for (const f of agents) {
      const dst = path.join(AGENTS_DST, f);
      await fs.rm(dst, { force: true });
      console.log(`  - agent: ${f}`);
    }
    for (const s of skills) {
      const dst = path.join(SKILLS_DST, s);
      await fs.rm(dst, { recursive: true, force: true });
      console.log(`  - skill: ${s}/`);
    }
    console.log('\n完成。已在 VS Code 中 Reload Window 生效。');
    return;
  }

  const dryRun = mode === '--dry-run';
  console.log(`${dryRun ? '[dry-run] ' : ''}同步到用户级目录：${DEST}`);
  console.log(`  agents: ${agents.length} 个，skills: ${skills.length} 个\n`);

  if (!dryRun) {
    await fs.mkdir(AGENTS_DST, { recursive: true });
    await fs.mkdir(SKILLS_DST, { recursive: true });
  }

  for (const f of agents) {
    const src = path.join(AGENTS_SRC, f);
    const dst = path.join(AGENTS_DST, f);
    if (!dryRun) await fs.copyFile(src, dst);
    console.log(`  agent: ${f}`);
  }
  for (const s of skills) {
    const src = path.join(SKILLS_SRC, s);
    const dst = path.join(SKILLS_DST, s);
    if (!dryRun) await fs.cp(src, dst, { recursive: true });
    console.log(`  skill: ${s}/`);
  }

  if (!dryRun) {
    console.log('\n完成。请在 VS Code 中 Reload Window（Developer: Reload Window）以生效。');
    console.log('提示：本仓库 .github/agents 与 .github/skills 仍为唯一源；拉取更新后重跑本脚本即可同步。');
  }
}

main().catch((e) => {
  console.error('同步失败：', e.message);
  process.exit(1);
});
