---
name: api-contract
description: API 契约优先工作流（docs/api/ + OpenAPI）。Use when designing or changing a backend API, or aligning frontend/backend on a contract.
---

# SKILL: API 契约优先

适用：Planner / Developer / Reviewer。原则：**先定契约，再写实现**；前后端均以 `docs/api/` 为准。

## 工作流

1. **写契约**：在 `docs/api/<domain>.md` 定义接口；有取舍的决策走 `docs/decisions/`。
2. **确认**：契约交调度者/用户确认后再分派实现；变更契约须同步更新文档。
3. **实现**：后端按契约实现并让 OpenAPI（FastAPI `/docs`、Spring `/v3/api-docs`）与之对齐；前端按契约开发。
4. **验收**：Reviewer 逐字段比对实现与契约（路径、方法、参数、错误码、响应结构）。

## 契约模板

```markdown
# API 契约：<模块>

> 契约先行：前后端实现均以本文件为准；变更需调度者确认后更新。

## <METHOD> <路径>

一句话说明。

### 请求
（JSON 示例 + 字段表：名称 / 类型 / 必填 / 校验规则）

### 响应
**200** （JSON 示例）
**错误**（统一错误体：HTTP / code / 场景）

### 安全要求
（鉴权、限流、幂等、脱敏等）
```

## 硬性规范

- **统一错误体**：`{"code": "...", "message": "...", "detail": ...}`；HTTP 状态码语义正确（400/401/403/404/409/422/429/500）。
- **命名**：REST 路径小写复数名词；资源 ID 用路径参数；版本前缀 `/api/v1/`。
- **参数校验**：字段级约束写进契约（长度、格式、枚举），后端用 Pydantic / Bean Validation 落地，前端复用同一套规则。
- **安全敏感**：错误信息不区分"用户不存在/密码错误"（防枚举）；敏感字段脱敏；登录失败限流。
- **向后兼容**：新增字段给默认值；废弃字段先标记 deprecated 再移除；破坏性变更升版本。
