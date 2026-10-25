---
name: database-migrations
description: 数据库迁移规范（Alembic 与 Flyway）。Use when adding or changing database schema, or writing/reviewing migration scripts.
---

# SKILL: 数据库迁移

适用：Developer / Reviewer。FastAPI 用 Alembic，Spring Boot 用 Flyway；**禁止手写 DDL 直接落库**。

## 通用原则

1. **可重放**：迁移脚本从头执行到最新应得到同一 schema；升级脚本幂等。
2. **可回滚**：有回滚思路（Flyway 可用 `undo`，Alembic 用 `downgrade`），必要时写在 PR 描述。
3. **一卡一迁移**：一次迁移只做一件 schema 变更，便于审查与回滚。
4. **数据安全**：大表加列给默认值；改列类型评估锁表；破坏性变更需先备份/双写方案。
5. **迁移与代码同提交**：实体/模型变更与迁移脚本放在同一任务卡，不脱节。

## Alembic（backend-py）

```bash
alembic revision --autogenerate -m "add users table"   # 生成后必须人工审查
alembic upgrade head                                    # 应用
alembic downgrade -1                                    # 回滚一步
```

- 自动生成的脚本要人工核对：默认值、nullable、索引名、数据迁移是否丢失。
- 涉及数据回填的迁移，用 `op.execute()` 写显式 SQL，避免依赖 ORM 模型在历史版本的变化。

## Flyway（backend-java）

- 命名：`V<版本>__<描述>.sql`（双下划线），如 `V2__add_users.sql`。
- 已应用的脚本**不可修改**；发现错误用新版本脚本修正。
- 脚本内写 `INSERT/UPDATE` 等 DML 同样要走参数化/转义，防注入与编码问题。

## 审查要点

- [ ] 迁移脚本与实际实体/模型一致（字段、类型、约束、索引）。
- [ ] 有无 `DROP`/`TRUNCATE` 等破坏性操作，是否经过评审。
- [ ] 有无索引与查询匹配；外键、唯一约束是否正确兜底。
- [ ] 是否包含测试数据或环境相关值（不应包含）。
