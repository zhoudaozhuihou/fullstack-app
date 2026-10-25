---
name: react-mui-tailwind
description: React 18 + TypeScript + Material UI v5 + Tailwind CSS v3 前端规范。Use when building or modifying frontend components, pages, hooks, stores, routes, or API clients.
---

# SKILL: React + Material UI + Tailwind CSS 前端开发

适用：`frontend/`。基线：React 18 + TypeScript（strict）+ Vite，Material UI v5，Tailwind CSS v3。

## 工程结构

```
frontend/
├── src/
│   ├── api/            # 接口层：axios/fetch 封装、按域拆分的 API 客户端、类型
│   ├── components/     # 通用组件（Button、Modal 封装等），可复用、无业务
│   ├── features/       # 按业务域组织：feature/{components,hooks,api,types}
│   ├── hooks/          # 通用 hooks（useAuth、useDebounce...）
│   ├── pages/          # 路由页面（薄壳，组合 feature 组件）
│   ├── routes/         # 路由配置 + 路由守卫
│   ├── stores/         # 全局状态（Zustand/Redux Toolkit，按需）
│   ├── theme/          # MUI 主题定制 createTheme
│   └── utils/
├── .env.example        # VITE_API_BASE_URL 等
├── tailwind.config.js  # tailwindcss + MUI 前缀共存配置
└── vite.config.ts
```

## MUI 与 Tailwind 共存规则（关键）

1. **MUI 为主，Tailwind 为辅**：组件库能力（Button/Dialog/DataGrid/Table/TextField/Select）用 MUI，保证交互一致性与无障碍；Tailwind 只用于**布局、间距、一次性微调**（`flex`、`mt-4`、`grid` 等）。
2. **Tailwind 加前缀避免冲突**：`tailwind.config.js` 里 `important: '#root'` 或 `prefix: 'tw-'`，并对 MUI 组件用 CSS baseline 预设（官方 `CssBaseline` + Tailwind preflight 兼容配置）。
3. **主题统一**：颜色、字号、间距一律走 MUI `theme`（`useTheme()` / `sx`），Tailwind 端通过 `tailwind.config.js` 映射同一套色板变量，**禁止两处各写一套色值**。
4. 样式优先级：MUI `sx` prop > styled() > Tailwind 工具类；禁止内联 `style={{}}` 写可主题化的属性。

## 硬性规范

- **TypeScript strict**：API 响应必须有 interface/type；禁止 `any`（实在必要时 `unknown` + 收窄）；组件 props 用 `interface` 并导出。
- **组件规范**：函数组件；每个文件一个组件；超过 ~200 行必须拆分；列表渲染必须稳定 `key`（禁止 index 做 key 处理动态列表）。
- **数据请求**：统一走 `src/api/` 封装（拦截器注入 JWT、统一错误处理→401 跳登录、错误 toast）；组件内用 TanStack Query 或自定义 hook，**不在组件里裸写 fetch**。
- **状态管理**：服务端状态归 TanStack Query；跨页面客户端状态才进 store；避免把一切都塞进全局 store。
- **表单**：react-hook-form + MUI；校验规则与后端契约一致（错误信息用后端返回的 message）。
- **路由**：懒加载 `React.lazy` + `Suspense`；鉴权路由用守卫组件统一处理。
- **安全**：禁止 `dangerouslySetInnerHTML` 渲染未消毒内容；token 存内存/刷新方案优先，`localStorage` 需评审同意。
- **性能**：大列表虚拟化（`@tanstack/react-virtual`）；图片懒加载；避免在 render 中创建新对象/函数传给 memo 子组件。

## 验收命令

```bash
npm run lint && npx tsc --noEmit
npm run test           # Vitest + Testing Library
npm run build          # 产出可构建成功为底线
npm run dev            # 本地自测
```
