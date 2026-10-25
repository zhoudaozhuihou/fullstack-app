---
name: review
description: 代码审查清单（正确性/安全/性能/架构/可维护性）。Use when reviewing a task diff and producing a review report.
---

# SKILL: 代码审查清单

适用角色：Reviewer / Security Auditor。逐项过，问题分级：🔴 Critical（阻塞合并） / 🟡 Major（应修） / 🟢 Minor（建议） / 💬 Nit。

## 1. 范围与一致性

- [ ] 改动是否严格在任务卡范围内？有无夹带无关重构/格式化噪音？
- [ ] 实现是否符合 API 契约（`docs/api/`）：路径、方法、参数、错误码、响应结构逐字段对齐。
- [ ] 提交信息符合 Conventional Commits 且带任务卡号。

## 2. 安全（零容忍，命中即 Critical）

- [ ] SQL/命令注入：是否全部参数化查询（SQLAlchemy select / JPA / MyBatis `#{}`）。
- [ ] 鉴权与越权：新端点是否经过鉴权依赖/Security 链；是否校验**资源归属**（IDOR：用户 A 能否访问用户 B 的资源 ID）。
- [ ] 密钥/敏感信息：代码、日志、测试、错误信息中无密钥、token、明文密码、身份证号等 PII。
- [ ] 输入校验：所有入口（REST 参数、query、header、文件上传）有白名单化校验；文件上传限制类型与大小。
- [ ] XSS / 前端注入：无 `dangerouslySetInnerHTML` 渲染用户内容；富文本经过消毒。
- [ ] CORS、CSRF、Cookie 属性（HttpOnly/Secure/SameSite）配置合理。
- [ ] 依赖无已知高危漏洞（提请关注新增依赖版本）。

## 3. 正确性

- [ ] 边界条件：空列表、null/None、0、极大值、并发提交、重复请求（幂等）。
- [ ] 错误处理：异常被捕获后不是吞掉（空 catch / except: pass）；事务回滚语义正确。
- [ ] 并发与竞态：共享可变状态、缓存失效、数据库唯一约束兜底。
- [ ] 时区与时间：统一 UTC 存库；展示层转换；无 `new Date()` 隐式本地时间入库。

## 4. 架构与分层

- [ ] 分层未被打破（router/controller 不含业务逻辑；service 不依赖 HTTP 对象）。
- [ ] 无循环依赖；公共逻辑提取位置合理（不过度抽象，重复 <3 次不急抽）。
- [ ] 数据库：迁移脚本可重放、有回滚思路；查询有分页；无明显 N+1；索引与查询匹配。

## 5. 前端专项（React + MUI + Tailwind）

- [ ] 类型完整，无 `any`；API 响应有类型定义。
- [ ] MUI/Tailwind 分工符合 SKILL.md（MUI 组件、Tailwind 布局）；色值走统一主题而非硬编码。
- [ ] 状态归属正确（服务端状态在 Query，不复制进 store）；无重复请求/瀑布式串行请求。
- [ ] 列表 key、受控组件、事件清理（useEffect return）正确。

## 6. 测试质量（抽查）

- [ ] 测试真实运行且断言有意义（不是 `expect(true)` 凑数）。
- [ ] 核心分支（成功 + 至少主要失败路径）有覆盖。
- [ ] 测试不依赖执行顺序、不依赖真实外部服务。

## 7. 可维护性

- [ ] 命名达意；函数 <50 行、文件不过度膨胀；复杂逻辑有"为什么"注释。
- [ ] 无 TODO 欠账（有则须挂任务卡号）。
- [ ] 日志可定位问题（含上下文字段），无 print/system.out。

## 输出格式

写入 `docs/reports/REVIEW-Txxx.md`，按 `🔴/🟡/🟢/💬 + 文件:行号 + 问题 + 建议` 列表呈现，最后给结论 APPROVE / REQUEST_CHANGES / BLOCK。
