---
name: springboot
description: Java 17 Spring Boot 3 后端规范（Spring Security / JPA / Flyway / springdoc）。Use when building or modifying backend-java services, controllers, services, repositories, entities, DTOs, or Flyway migrations.
---

# SKILL: Spring Boot 后端开发

适用：`backend-java/` 服务。基线：Java 17+，Spring Boot 3.x，Maven。

## 工程结构

```
backend-java/
├── src/main/java/com/example/app/
│   ├── Application.java
│   ├── config/            # SecurityConfig, CorsConfig, OpenApiConfig
│   ├── controller/        # REST 层：参数校验 + 调 service + DTO 转换
│   ├── service/           # 业务逻辑 + @Transactional 边界
│   ├── repository/        # Spring Data JPA（或 MyBatis-Plus mapper）
│   ├── entity/            # JPA 实体
│   ├── dto/               # 请求/响应 DTO，用 record
│   ├── mapper/            # MapStruct 或手写转换器
│   ├── exception/         # 业务异常 + @RestControllerAdvice 全局处理
│   └── security/          # JWT filter、UserDetailsService
├── src/main/resources/
│   ├── application.yml    # 公共配置；application-dev/prod.yml 分环境
│   └── db/migration/      # Flyway 迁移脚本 V1__init.sql ...
└── src/test/java/...      # JUnit 5 + Mockito + @SpringBootTest 切片测试
```

## 硬性规范

- **Java 17 特性**：DTO 用 `record`；switch 用增强模式；优先不可变集合 `List.of()`。
- **分层**：Controller 薄、Service 厚；事务边界在 Service 层（`@Transactional` 只标写操作）。
- **校验**：DTO 上 `jakarta.validation` 注解（`@NotNull/@Size/@Pattern`）+ Controller 参数 `@Valid`；错误由 `@RestControllerAdvice` 统一转成 `{code, message, detail}`。
- **数据库**：Flyway 管理迁移；JPA 实体避免 `EAGER` 关联；列表查询必须分页（`Pageable`）；禁止 N+1（用 `@EntityGraph` / join fetch）。
- **安全**：Spring Security + JWT filter；`SecurityFilterChain` 显式声明公开/保护路径；密码 BCryptPasswordEncoder；CORS 白名单化，禁止 `*` 携带凭据。
- **配置**：环境变量覆盖（`SPRING_DATASOURCE_PASSWORD` 等）；密钥不入 yml 入 git。
- **API 文档**：`springdoc-openapi`，注解补全描述；与 `docs/api/` 契约保持一致。
- **日志**：SLF4J + logback；禁止 `e.printStackTrace()`，异常要带堆栈记录 `log.error("msg", e)`。

## 代码风格

- 构造器注入（或 Lombok `@RequiredArgsConstructor`），禁止字段 `@Autowired`。
- 常量类替代魔法值；异常类语义化（`ResourceNotFoundException` 等）。

## 验收命令

```bash
mvn -q verify            # 编译 + 单测 + 打包
mvn spring-boot:run      # 本地起服，自查 /v3/api-docs
```
