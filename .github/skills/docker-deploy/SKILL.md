---
name: docker-deploy
description: Docker 与本地/生产部署（docker-compose、Dockerfile、环境变量）。Use when containerizing services or changing deploy configuration.
---

# SKILL: Docker 与部署

适用：Developer（容器化）/ Reviewer（部署审查）。本地编排见 `deploy/docker-compose.yml`。

## 结构

```
deploy/
├── docker-compose.yml      # postgres + redis（+ full profile 三服务）
backend-py/Dockerfile        # 待补（服务成熟后）
backend-java/Dockerfile      # 待补
frontend/Dockerfile          # 待补
```

## Dockerfile 规范

- **多阶段构建**：构建产物与运行时分离，镜像最小化；前端产物由 nginx 托管。
- **非 root 运行**：`USER` 指定非 root 用户，降低容器逃逸影响。
- **健康检查**：`HEALTHCHECK` 暴露就绪状态，供 compose `depends_on: condition` 使用。
- **确定性构建**：锁依赖（`package-lock.json`/`requirements.lock`/`pom.xml`），指定基础镜像 tag。

## docker-compose 规范

- 配置一律环境变量（`${VAR}` + `.env.example`），**不在 compose 文件写密钥**。
- 数据卷 `volumes:` 持久化（postgres/redis）；端口映射仅暴露必要端口。
- 用 `depends_on` 保证启动顺序；`profiles` 控制可选服务（如 `full`）。
- 生产与本地分离：本地可用 `-dev` override 文件，生产走编排平台（k8s/云）。

## 环境变量与密钥

- 所有服务配置支持环境变量覆盖（`DATABASE_URL`、`SPRING_DATASOURCE_PASSWORD`、`VITE_API_BASE_URL`）。
- 密钥用 secret 管理（compose secrets / k8s Secret / 云密钥服务），禁止镜像内硬编码或提交 git。

## 验证

```bash
cd deploy && docker compose config      # 校验 compose 语法
docker compose up -d postgres redis     # 起基础设施
docker compose logs -f backend-py       # 查看服务日志
```
