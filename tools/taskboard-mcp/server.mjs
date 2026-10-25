#!/usr/bin/env node
/**
 * taskboard-mcp — 零依赖 MCP (Model Context Protocol) stdio 服务器。
 *
 * 暴露任务板工具，让 Copilot 通过工具调用读写 docs/tasks/ 下的任务卡，
 * 替代纯手写文件，作为 Agent 间文件总线的程序化入口。
 *
 * 协议：stdio 传输，换行分隔的 JSON-RPC 2.0（与 MCP 官方 stdio transport 一致）。
 * 依赖：仅 Node.js ≥ 18 内置模块，无需 npm install。
 */
import readline from 'node:readline';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// 自定位仓库根：本文件位于 <root>/tools/taskboard-mcp/server.mjs，故根在其上两级。
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = process.env.TASKBOARD_ROOT || path.resolve(__dirname, '..', '..');
const TASKS_DIR = path.join(ROOT, 'docs', 'tasks');

const SERVER = { name: 'taskboard-mcp', version: '0.1.0' };
const PROTOCOL_VERSION = '2024-11-05';

// ---------------------------------------------------------------------------
// 工具定义
// ---------------------------------------------------------------------------
const TOOLS = [
  {
    name: 'list_tasks',
    description:
      '列出 docs/tasks/ 下的所有任务卡，返回 id、标题、状态、负责人、优先级、依赖、分支与文件路径。可选按状态过滤。',
    inputSchema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          description:
            '按状态过滤：TODO | IN_PROGRESS | DEV_DONE | TESTING | REVIEW | DONE | BLOCKED',
        },
      },
    },
  },
  {
    name: 'get_task',
    description: '读取单个任务卡的完整内容。',
    inputSchema: {
      type: 'object',
      properties: {
        task_id: { type: 'string', description: '任务卡 id，如 T001' },
      },
      required: ['task_id'],
    },
  },
  {
    name: 'create_task',
    description:
      '按模板新建一张任务卡，写入 docs/tasks/T<id>-<slug>.md。不覆盖已存在的同名卡片。',
    inputSchema: {
      type: 'object',
      properties: {
        task_id: { type: 'string', description: '任务卡 id，如 T002' },
        title: { type: 'string', description: '任务标题（中文短句）' },
        slug: {
          type: 'string',
          description: '文件名短标识（英文 kebab-case），如 login-api',
        },
        priority: {
          type: 'string',
          description: '优先级 P0 | P1 | P2，默认 P1',
          enum: ['P0', 'P1', 'P2'],
        },
        dependencies: {
          type: 'string',
          description: '依赖的任务卡 id，逗号分隔，如 T001, T002；无则写 无',
        },
        background: { type: 'string', description: '背景与目标（可选）' },
      },
      required: ['task_id', 'title', 'slug'],
    },
  },
  {
    name: 'update_task',
    description:
      '更新任务卡的状态 / 负责人 / 优先级（仅修改对应字段行）。',
    inputSchema: {
      type: 'object',
      properties: {
        task_id: { type: 'string', description: '任务卡 id，如 T001' },
        status: {
          type: 'string',
          enum: [
            'TODO',
            'IN_PROGRESS',
            'DEV_DONE',
            'TESTING',
            'REVIEW',
            'DONE',
            'BLOCKED',
          ],
        },
        owner: {
          type: 'string',
          enum: ['developer', 'tester', 'reviewer', 'planner', 'security-auditor', 'researcher'],
        },
        priority: { type: 'string', enum: ['P0', 'P1', 'P2'] },
      },
      required: ['task_id'],
    },
  },
];

// ---------------------------------------------------------------------------
// 任务卡解析
// ---------------------------------------------------------------------------
const FIELD_LABEL = {
  status: '状态',
  owner: '负责人',
  priority: '优先级',
  dependencies: '依赖',
  branch: '分支',
};

function parseCard(filePath, content) {
  const lines = content.split(/\r?\n/);
  const card = { path: path.relative(ROOT, filePath) };
  for (const line of lines) {
    const titleMatch = line.match(/^#\s+(.+?)\s*$/);
    if (titleMatch && !card.title) {
      card.title = titleMatch[1];
      continue;
    }
    const fieldMatch = line.match(/^-\s*([^:：]+)[:：]\s*(.*)$/);
    if (fieldMatch) {
      const key = fieldMatch[1].trim();
      const value = fieldMatch[2].trim();
      for (const [en, zh] of Object.entries(FIELD_LABEL)) {
        if (key === zh || key.toLowerCase() === en) card[en] = value;
      }
    }
  }
  // 从文件名推断 id（如 T001-login-api.md → T001）
  const base = path.basename(filePath, '.md');
  const idMatch = base.match(/^(T\d{3,})/);
  if (idMatch) card.id = idMatch[1];
  return card;
}

async function listTaskFiles() {
  const entries = await fs.readdir(TASKS_DIR).catch((e) => {
    if (e.code === 'ENOENT') return [];
    throw e;
  });
  return entries.filter((f) => f.endsWith('.md')).sort();
}

async function findTaskFile(taskId) {
  const files = await listTaskFiles();
  const norm = taskId.trim().toUpperCase();
  const match = files.find((f) => f.toUpperCase().startsWith(norm + '-') || f.toUpperCase().startsWith(norm + '.'));
  return match ? path.join(TASKS_DIR, match) : null;
}

// ---------------------------------------------------------------------------
// 工具实现
// ---------------------------------------------------------------------------
async function listTasks(args = {}) {
  const files = await listTaskFiles();
  const cards = [];
  for (const f of files) {
    const content = await fs.readFile(path.join(TASKS_DIR, f), 'utf8');
    const card = parseCard(path.join(TASKS_DIR, f), content);
    if (args.status && card.status !== args.status) continue;
    cards.push(card);
  }
  return JSON.stringify(cards, null, 2);
}

async function getTask(args) {
  const file = await findTaskFile(args.task_id);
  if (!file) return `任务卡 ${args.task_id} 不存在。`;
  const content = await fs.readFile(file, 'utf8');
  return `# ${path.basename(file)}\n\n${content}`;
}

async function createTask(args) {
  const id = args.task_id.trim().toUpperCase();
  if (!/^T\d{3,}$/.test(id)) return 'task_id 需形如 T002（至少三位数字）。';
  const slug = (args.slug || '').trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-');
  if (!slug) return 'slug 不能为空（英文 kebab-case）。';
  const filename = `${id}-${slug}.md`;
  const file = path.join(TASKS_DIR, filename);
  const exists = await fs.access(file).then(() => true).catch(() => false);
  if (exists) return `任务卡 ${filename} 已存在，未覆盖。`;

  const priority = args.priority || 'P1';
  const deps = args.dependencies ? args.dependencies.trim() : '无';
  const background = args.background ? args.background.trim() : '（待补充）';
  const content = `# ${id}：${args.title.trim()}

- 状态: TODO
- 负责人: developer
- 优先级: ${priority}
- 依赖: ${deps}
- 分支: feat/${id}-${slug}

## 背景与目标
${background}

## 交付物
- [ ] 待补充

## 实现要点 / 验收标准
1. 待补充

## 测试要点
- 核心路径：
- 边界/异常：

## 进展记录
- 创建于 taskboard-mcp
`;
  await fs.mkdir(TASKS_DIR, { recursive: true });
  await fs.writeFile(file, content, 'utf8');
  return `已创建任务卡 ${filename}`;
}

async function updateTask(args) {
  const file = await findTaskFile(args.task_id);
  if (!file) return `任务卡 ${args.task_id} 不存在。`;
  let content = await fs.readFile(file, 'utf8');
  const changes = [];
  const setField = (en, value) => {
    const zh = FIELD_LABEL[en];
    if (!zh || value === undefined) return;
    const re = new RegExp(`^(-\\s*${zh}\\s*[:：]\\s*).*$`, 'm');
    if (re.test(content)) {
      content = content.replace(re, `$1${value}`);
    } else {
      // 字段行不存在则在文件开头标题后插入
      content = content.replace(/(^#\s+.+\n)/, `$1\n- ${zh}: ${value}`);
    }
    changes.push(`${zh}=${value}`);
  };
  setField('status', args.status);
  setField('owner', args.owner);
  setField('priority', args.priority);

  if (changes.length === 0) return '未提供任何要更新的字段。';
  await fs.writeFile(file, content, 'utf8');
  return `已更新 ${path.basename(file)}：${changes.join(', ')}`;
}

const IMPLEMENTATIONS = {
  list_tasks: listTasks,
  get_task: getTask,
  create_task: createTask,
  update_task: updateTask,
};

// ---------------------------------------------------------------------------
// JSON-RPC / MCP 处理
// ---------------------------------------------------------------------------
function send(obj) {
  process.stdout.write(JSON.stringify(obj) + '\n');
}

async function handleMessage(msg) {
  if (!msg || typeof msg !== 'object') return;

  // 通知（无 id）不回复
  if (msg.method === 'notifications/initialized') return;
  if (msg.method === 'notifications/cancelled') return;

  const id = msg.id;

  switch (msg.method) {
    case 'initialize':
      send({
        jsonrpc: '2.0',
        id,
        result: {
          protocolVersion: PROTOCOL_VERSION,
          capabilities: { tools: {} },
          serverInfo: SERVER,
        },
      });
      break;
    case 'ping':
      send({ jsonrpc: '2.0', id, result: {} });
      break;
    case 'tools/list':
      send({ jsonrpc: '2.0', id, result: { tools: TOOLS } });
      break;
    case 'tools/call': {
      const { name, arguments: args } = msg.params || {};
      const impl = IMPLEMENTATIONS[name];
      if (!impl) {
        send({
          jsonrpc: '2.0',
          id,
          result: {
            content: [{ type: 'text', text: `未知工具: ${name}` }],
            isError: true,
          },
        });
        return;
      }
      try {
        const text = await impl(args || {});
        send({ jsonrpc: '2.0', id, result: { content: [{ type: 'text', text }] } });
      } catch (e) {
        send({
          jsonrpc: '2.0',
          id,
          result: {
            content: [{ type: 'text', text: `执行失败: ${e.message}` }],
            isError: true,
          },
        });
      }
      break;
    }
    default:
      // 未知方法：方法未找到错误
      send({
        jsonrpc: '2.0',
        id,
        error: { code: -32601, message: `Method not found: ${msg.method}` },
      });
  }
}

const rl = readline.createInterface({ input: process.stdin });
let queue = Promise.resolve();
rl.on('line', (line) => {
  if (!line.trim()) return;
  let msg;
  try {
    msg = JSON.parse(line);
  } catch {
    return; // 忽略非 JSON 行
  }
  queue = queue.then(() => handleMessage(msg)).catch((e) => {
    // 防御：单条处理异常不拖垮整条队列
    if (msg && msg.id !== undefined) {
      send({
        jsonrpc: '2.0',
        id: msg.id,
        error: { code: -32603, message: String(e && e.message) },
      });
    }
  });
});
