---
name: python-fastapi
description: Python ≥ 3.11 FastAPI + Pydantic v2 + SQLAlchemy 2.0 async 后端开发规范。Use when building or modifying backend-py services, endpoints, models, schemas, services, or Alembic migrations.
---

# SKILL: Python + FastAPI 后端开发

适用：`backend-py/` 服务。基线：Python ≥ 3.11，FastAPI + Pydantic v2 + SQLAlchemy 2.0 (async)。

## 工程结构

```
backend-py/
├── app/
│   ├── main.py              # 入口：create_app(), 挂路由/中间件
│   ├── core/
│   │   ├── config.py        # pydantic-settings，全部配置走环境变量
│   │   ├── security.py      # JWT 签发/校验、密码哈希(passlib/bcrypt)
│   │   ├── exceptions.py    # 业务异常 + 全局 exception handler
│   │   └── deps.py          # 依赖注入：get_db, get_current_user, 分页
│   ├── api/                 # 路由层：只做参数解析 + 调 service + 返回 schema
│   │   └── v1/endpoints/
│   ├── services/            # 业务逻辑层（可测、不依赖 HTTP 对象）
│   ├── models/              # SQLAlchemy ORM 模型
│   ├── schemas/             # Pydantic v2 请求/响应模型（与 ORM 模型分离）
│   └── db/                  # session/engine、alembic 迁移
├── tests/
├── pyproject.toml           # ruff + mypy + pytest 配置都在这里
└── .env.example
```

## 硬性规范

- **分层**：router 不写业务逻辑；service 不 import FastAPI 的 Request/Response。
- **类型标注全覆盖**：所有函数签名有类型；`mypy --strict` 目标模式下无 error（可从 basic 起步，但禁止 Any 泛滥）。
- **Pydantic v2**：用 `model_config = ConfigDict(from_attributes=True)` 代替 v1 的 `orm_mode`；校验用 `Field(ge=, max_length=)`，不用手写 if。
- **异步一致**：用 async SQLAlchemy 时全链路 async；禁止在 async 路由里调同步阻塞 IO。
- **统一响应与错误**：自定义业务异常 + 全局 exception handler，错误体统一 `{"code": "...", "message": "...", "detail": ...}`；HTTP 状态码语义正确（400/401/403/404/409/422/500）。
- **数据库**：一律 Alembic 迁移，禁止手写 DDL；查询用 SQLAlchemy 2.0 `select()` 风格；**杜绝字符串拼接 SQL**（注入风险）。
- **鉴权**：JWT（`python-jose`/`pyjwt`），access token 短有效期；密码 `passlib[bcrypt]`；依赖注入 `get_current_user` 统一鉴权，权限校验在 service 层做。
- **配置**：`pydantic-settings` 的 `Settings` 类 + `.env`；任何密钥不入库不入 git。
- **文档**：FastAPI 自动 OpenAPI 即契约来源；对外接口必须有 docstring（用于生成文档）。

## 代码风格

- `ruff` 同时承担 lint + format（`ruff check --fix && ruff format`）。
- 命名：模块 snake_case，类 PascalCase，常量 UPPER_SNAKE。
- 日志用 `logging`（结构化尽量用 `structlog`），禁止 `print`。

## 验收命令

```bash
ruff check app tests && mypy app
pytest -q                    # 单测
uvicorn app.main:app --reload  # 本地起服，自查 /docs
```
