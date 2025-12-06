# Docker 使用示例

本文档提供了常见场景的 Docker 使用示例。

## 📖 场景示例

### 场景 1：本地开发和测试

```bash
# 1. 克隆项目
git clone <repository-url>
cd react-xiuxian-game

# 2. 配置环境变量
cat > .env << EOF
VITE_AI_KEY=your_api_key_here
VITE_AI_PROVIDER=glm
EOF

# 3. 一键构建并启动
npm run docker:build-and-up
# 或
make build-and-up

# 4. 访问应用
# 浏览器打开: http://localhost:3000

# 5. 查看日志（可选）
npm run docker:logs
# 或
make logs

# 6. 停止服务
npm run docker:down
# 或
make down
```

---

### 场景 2：打包镜像用于离线部署

**在有网络的机器上：**

```bash
# 1. 配置环境变量
cat > .env << EOF
VITE_AI_KEY=your_api_key_here
VITE_AI_PROVIDER=glm
EOF

# 2. 一键构建并打包
npm run docker:build-and-pack
# 或
make build-and-pack

# 3. 查看生成的文件
ls -lh react-xiuxian-game.tar.gz
# 输出类似: -rw-r--r-- 1 user user 45M Dec  5 10:30 react-xiuxian-game.tar.gz

# 4. 将文件传输到目标机器
scp react-xiuxian-game.tar.gz user@target-server:/path/to/destination/
# 或使用 U盘、网盘等方式传输
```

**在目标机器上：**

```bash
# 1. 导入镜像
docker load < react-xiuxian-game.tar.gz

# 2. 验证镜像
docker images | grep react-xiuxian-game

# 3. 运行容器
docker run -d -p 3000:80 --name react-xiuxian-game react-xiuxian-game:latest

# 4. 访问应用
# 浏览器打开: http://localhost:3000
```

---

### 场景 3：使用不同的 AI 提供商

**使用 OpenAI：**

```bash
# 配置环境变量
cat > .env << EOF
VITE_AI_KEY=sk-your-openai-key
VITE_AI_PROVIDER=openai
VITE_AI_MODEL=gpt-4
EOF

# 构建并启动
npm run docker:build-and-up
```

**使用自定义 API：**

```bash
# 配置环境变量
cat > .env << EOF
VITE_AI_KEY=your_custom_key
VITE_AI_PROVIDER=custom
VITE_AI_API_URL=https://your-custom-api.com/v1
VITE_AI_MODEL=your-model-name
EOF

# 构建并启动
npm run docker:build-and-up
```

---

### 场景 4：更新代码后重新构建

```bash
# 拉取最新代码
git pull origin main

# 停止旧容器
npm run docker:down

# 无缓存重新构建并启动
npm run docker:build-no-cache
npm run docker:up

# 或使用 Docker Compose 的组合命令
docker-compose up -d --build --force-recreate
```

---

### 场景 5：多环境部署

**开发环境（.env.dev）：**

```bash
# 创建开发环境配置
cat > .env.dev << EOF
VITE_AI_KEY=dev_api_key
VITE_AI_PROVIDER=glm
EOF

# 使用开发配置构建
docker-compose --env-file .env.dev build
docker-compose --env-file .env.dev up -d
```

**生产环境（.env.prod）：**

```bash
# 创建生产环境配置
cat > .env.prod << EOF
VITE_AI_KEY=prod_api_key
VITE_AI_PROVIDER=glm
EOF

# 使用生产配置构建和打包
docker-compose --env-file .env.prod build
docker save react-xiuxian-game:latest | gzip > react-xiuxian-game-prod.tar.gz
```

---

### 场景 6：故障排查

**查看容器状态：**

```bash
# 查看运行中的容器
docker ps

# 查看所有容器（包括停止的）
docker ps -a

# 查看容器详细信息
docker inspect react-xiuxian-game
```

**查看日志：**

```bash
# 实时查看日志
npm run docker:logs

# 查看最近 100 行日志
docker logs --tail 100 react-xiuxian-game

# 查看最近 10 分钟的日志
docker logs --since 10m react-xiuxian-game
```

**进入容器调试：**

```bash
# 进入容器 Shell
docker exec -it react-xiuxian-game sh

# 在容器内查看文件
ls -la /usr/share/nginx/html/

# 查看 nginx 配置
cat /etc/nginx/conf.d/default.conf

# 退出容器
exit
```

**检查镜像：**

```bash
# 查看镜像列表
docker images

# 查看镜像详细信息
docker inspect react-xiuxian-game:latest

# 查看镜像构建历史
docker history react-xiuxian-game:latest
```

---

### 场景 7：清理和维护

**清理停止的容器：**

```bash
# 停止并删除容器
npm run docker:down

# 删除特定容器
docker rm -f react-xiuxian-game
```

**清理镜像：**

```bash
# 删除特定镜像
docker rmi react-xiuxian-game:latest

# 清理所有未使用的镜像
docker image prune -a

# 清理所有未使用的资源（包括容器、网络、镜像、缓存）
docker system prune -a
```

**清理打包文件：**

```bash
# 使用 Makefile 清理
make clean

# 或手动删除
rm -f react-xiuxian-game.tar react-xiuxian-game.tar.gz
```

---

## 🔍 常见问题

### Q: 为什么构建很慢？

A: 首次构建需要下载基础镜像和依赖包，可能需要几分钟。后续构建会使用缓存，速度会快很多。

**解决方案：**
- 使用 Docker 镜像加速器（参考 DOCKER.md）
- 在网络良好的时候进行构建

### Q: 如何验证环境变量是否正确注入？

A: 构建完成后，可以在浏览器控制台检查：

```javascript
// 打开浏览器控制台（F12）
console.log(import.meta.env.VITE_AI_PROVIDER)
```

### Q: 修改了环境变量后需要重新构建吗？

A: 是的，因为 Vite 环境变量是在构建时打包到静态文件中的。

```bash
# 重新构建
npm run docker:build-no-cache
npm run docker:up
```

### Q: 如何在不同端口运行？

A: 修改 `docker-compose.yml` 文件中的端口映射：

```yaml
ports:
  - "8080:80"  # 改为 8080 端口
```

或直接使用 Docker 命令：

```bash
docker run -d -p 8080:80 --name react-xiuxian-game react-xiuxian-game:latest
```

### Q: 打包的镜像文件太大怎么办？

A: 项目已使用多阶段构建优化镜像大小。可以进一步优化：

1. 使用压缩格式（.tar.gz）而不是 .tar
2. 清理不必要的依赖
3. 使用更小的基础镜像（已使用 alpine）

```bash
# 比较大小
docker save -o react-xiuxian-game.tar react-xiuxian-game:latest
ls -lh react-xiuxian-game.tar

docker save react-xiuxian-game:latest | gzip > react-xiuxian-game.tar.gz
ls -lh react-xiuxian-game.tar.gz
```

---

## 📝 最佳实践

1. **开发环境**：使用 `npm run dev` 进行本地开发，支持热重载
2. **测试环境**：使用 Docker 构建测试镜像，模拟生产环境
3. **生产环境**：使用打包的镜像进行部署，确保环境一致性
4. **定期备份**：定期导出镜像和配置文件进行备份
5. **版本管理**：为不同版本的镜像打上标签

```bash
# 为镜像打标签
docker tag react-xiuxian-game:latest react-xiuxian-game:v0.1.0

# 导出特定版本
docker save react-xiuxian-game:v0.1.0 | gzip > react-xiuxian-game-v0.1.0.tar.gz
```

---

## 🚀 快速参考

| 需求 | 命令 |
|------|------|
| 本地开发 | `npm run dev` |
| Docker 测试 | `npm run docker:build-and-up` |
| 打包镜像 | `npm run docker:build-and-pack` |
| 查看日志 | `npm run docker:logs` |
| 停止服务 | `npm run docker:down` |
| 清理文件 | `make clean` |

---

更多详细信息，请参考：
- [Docker 部署指南](DOCKER.md)
- [README](README.md)
- [更新日志](CHANGELOG.md)

