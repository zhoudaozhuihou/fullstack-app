# 任务卡模板

> 由调度者创建，保存为 `docs/tasks/Txxx-短标题.md`。卡片必须自包含：开发者/测试者只看卡片即可开工。

```markdown
# Txxx：<任务标题>

- 状态: TODO          # TODO | IN_PROGRESS | DEV_DONE | TESTING | REVIEW | DONE | BLOCKED
- 负责人: developer   # developer | tester | reviewer
- 优先级: P0          # P0 > P1 > P2
- 依赖: T001, T002    # 无则写 无
- 分支: feat/Txxx-短描述

## 背景与目标
（为什么做这个；属于哪个用户故事/里程碑）

## 交付物
- [ ] 具体交付物 1（如：POST /api/v1/login 接口，见 docs/api/auth.md）
- [ ] 具体交付物 2

## 实现要点 / 验收标准
1. 可验证的验收条件（Given...When...Then...）
2. 涉及技术栈: python-fastapi | springboot | react-mui-tailwind（对应加载哪个 SKILL）

## 测试要点
（调度者预填；tester 领单后补充完善）
- 核心路径：
- 边界/异常：

## 进展记录
（各会话追加，带日期；不要改写他人记录）
```
