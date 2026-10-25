# T001：用户登录接口（FastAPI 实现）

- 状态: TODO
- 负责人: developer
- 优先级: P0
- 依赖: 无
- 分支: feat/T001-login-api

## 背景与目标
实现系统首个鉴权接口，作为前后端联调的契约样板。API 契约见 `docs/api/auth.md`。

## 交付物
- [ ] `POST /api/v1/auth/login` 接口（backend-py）
- [ ] 统一错误体与业务异常处理（`app/core/exceptions.py` + 全局 handler）
- [ ] 登录失败计数（Redis）
- [ ] `.env.example` 更新（JWT_SECRET、DATABASE_URL、REDIS_URL）

## 实现要点 / 验收标准
1. Given 正确用户名密码，When 调用登录，Then 返回 200 + access_token；
2. Given 错误密码，Then 返回 400 INVALID_CREDENTIALS，响应不区分"用户不存在"；
3. Given 1 分钟内失败 5 次，Then 返回 429；
4. 参数非法返回 422，错误体符合统一格式；
5. 密码使用 bcrypt 存储；SQL 全参数化。

## 测试要点
- 核心路径：成功登录返回 token；token 可被解析出用户 ID；
- 边界/异常：错误密码、不存在用户、连续 5 次失败、空参数（422）。

## 进展记录
- 2026-10-25 调度者创建本卡（示例卡片，格式参考 agent-team/templates/task-card.md）。
