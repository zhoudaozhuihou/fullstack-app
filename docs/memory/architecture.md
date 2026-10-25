# 架构

## 服务拓扑与端口

| 服务 | 本地端口 | 说明 |
|------|---------|------|
| `backend-py`（FastAPI） | `8000` | 主 API 服务，默认签发 JWT |
| `backend-java`（Spring Boot） | `8081` | 独立领域服务（报表/批处理等），仅校验 JWT |
| `frontend`（Vite dev） | `5173` | 默认对接 FastAPI（`VITE_API_BASE_URL`） |
| `postgres` | `5432` | 主数据库 |
| `redis` | `6379` | 缓存 / 登录失败计数等 |

## 数据流与鉴权模型

- 前端 → FastAPI（主 API）：`VITE_API_BASE_URL` 指向 `http://localhost:8000`。
- 两后端共享用户与鉴权：**FastAPI 签发 JWT**，Spring Boot 只做校验（共享 secret / JWKS），避免双账号体系。
- API 契约以 `docs/api/*.md` 为准，契约先行；实现必须逐字段对齐。

## 关键约定

- 后端分层：router/controller 薄 → service 厚；service 不依赖 HTTP 对象。
- 数据库迁移：FastAPI 用 Alembic，Spring Boot 用 Flyway，禁止手写 DDL 落库。
- 统一错误体：`{"code": "...", "message": "...", "detail": ...}`，HTTP 状态码语义正确。

## 本地运行

```bash
# FastAPI
cd backend-py && pip install -e ".[dev]" && uvicorn app.main:app --reload

# Spring Boot
cd backend-java && mvn spring-boot:run

# 前端
cd frontend && npm install && npm run dev

# 基础设施（postgres + redis）
cd deploy && docker compose up -d
```

## 部署形态

- 本地：`deploy/docker-compose.yml` 一键编排基础设施（`full` profile 可拉起三服务）。
- CI：`.github/workflows/ci.yml` 三服务并行 lint + test（ruff/mypy/pytest、mvn verify、lint/tsc/vitest/build）。
