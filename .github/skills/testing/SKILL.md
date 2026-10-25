---
name: testing
description: 测试策略与标准（pytest / JUnit 5 / Vitest + Testing Library / Playwright）。Use when writing or running tests, or producing a test report for any service.
---

# SKILL: 测试策略与标准

适用角色：Tester（Developer 自检也参考）。

## 分层测试策略（金字塔）

| 层级 | 范围 | 占比目标 | 工具 |
|------|------|---------|------|
| 单元测试 | 纯函数、service 业务逻辑、hooks | 最多 | pytest / JUnit 5 + Mockito / Vitest |
| 集成/接口测试 | API 契约、DB 读写、鉴权链路 | 适中 | pytest + httpx / @SpringBootTest + MockMvc / Vitest + msw |
| E2E 测试 | 关键用户路径（登录、下单等 P0 流程） | 少量 | Playwright |

## 通用标准

1. **命名**：测试名描述行为——`test_login_with_wrong_password_returns_401` / `登录_密码错误_返回401`。禁止 `test1`、`test_2`。
2. **结构**：Given–When–Arrange/Act/Assert 三段式；一个测试只验证一个行为。
3. **AAA 独立**：测试之间零依赖、零共享可变状态；数据用 fixture / factory（`pytest.fixture`、`@BeforeEach`、test-data factory）生成。
4. **断言质量**：断言具体值而不是 `assert result is not None`；错误分支必须断言错误码/消息。
5. **外部依赖**：数据库用 testcontainers 或独立测试库；第三方 HTTP 用 msw/responses/WireMock mock 掉；时间用注入的 clock，禁止 `sleep` 等待。
6. **不测实现细节**：不 mock 被测对象内部方法；重构不该导致大面积测试修改。

## 各栈要点

### FastAPI（pytest）
- `httpx.AsyncClient` + ASGI transport 做接口测试，不起真实端口；
- 依赖覆盖 `app.dependency_overrides[get_db] = ...` 注入测试库；
- 参数化 `@pytest.mark.parametrize` 覆盖边界值与非法输入（422）。

### Spring Boot（JUnit 5）
- Controller 层：`@WebMvcTest` + `@MockBean` service；
- Service 层：纯 JUnit + Mockito；Repository 层：`@DataJpaTest` + H2/Testcontainers；
- JSON 断言用 `jsonPath("$.code").value(...)`。

### React（Vitest + Testing Library）
- 查询原则：按角色查询（`getByRole('button', { name: '提交' })`），不查 className；
- 测用户行为（`userEvent.click`），不测内部 state；
- API 用 msw 拦截；异步用 `await findBy...`，禁止手写 timeout。

### E2E（Playwright）
- 只覆盖 P0 路径（登录 → 核心业务流 → 退出）；
- 选择器优先 `getByRole/getByLabel`；断言网络空闲或元素可见，不写死 sleep。

## 报告要求

见 `agent-team/roles/03-tester.md`。每个 FAIL 缺陷必须含：复现步骤、期望 vs 实际、日志/截图、初步根因假设。
