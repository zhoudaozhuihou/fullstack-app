# API 契约：认证模块（示例）

> 契约先行：前后端实现均以本文件为准；变更需调度者确认后更新此处。

## POST /api/v1/auth/login

用户登录，成功返回 JWT access token。

### 请求

```json
{
  "username": "alice",
  "password": "string(8-64)"
}
```

| 字段 | 类型 | 必填 | 校验 |
|------|------|------|------|
| username | string | 是 | 3-32，字母数字下划线 |
| password | string | 是 | 8-64 |

### 响应

**200**

```json
{
  "code": "OK",
  "data": {
    "access_token": "eyJ...",
    "token_type": "bearer",
    "expires_in": 3600
  }
}
```

**错误**（统一错误体）

| HTTP | code | 场景 |
|------|------|------|
| 400 | INVALID_CREDENTIALS | 用户名或密码错误（不区分提示，防枚举） |
| 422 | VALIDATION_ERROR | 参数校验失败 |
| 429 | TOO_MANY_ATTEMPTS | 1 分钟内失败 ≥ 5 次 |

### 安全要求

- 密码 bcrypt 校验；失败不透露用户是否存在；
- 登录失败计数（Redis，key: `login:fail:{username}`，TTL 60s）；
- rate limit 见错误码 429。
