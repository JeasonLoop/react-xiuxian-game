# Docker 部署指南

## 📋 快速命令参考

### 使用 npm 脚本（推荐）

使用 npm 脚本可以更方便地管理 Docker 容器和镜像：

| 命令 | 说明 |
|------|------|
| `npm run docker:build` | 构建 Docker 镜像 |
| `npm run docker:build-no-cache` | 无缓存构建（强制重新构建） |
| `npm run docker:up` | 启动容器（后台运行） |
| `npm run docker:down` | 停止并删除容器 |
| `npm run docker:logs` | 查看容器日志（实时） |
| `npm run docker:pack` | 导出镜像为压缩包（.tar.gz） |
| `npm run docker:pack-uncompressed` | 导出未压缩镜像（.tar） |
| `npm run docker:build-and-pack` | **一键构建并打包** ⭐ |
| `npm run docker:build-and-up` | **一键构建并启动** ⭐ |

### 使用 Makefile（可选）

如果你习惯使用 `make` 命令，项目也提供了 Makefile：

| 命令 | 说明 |
|------|------|
| `make help` | 显示帮助信息 |
| `make build` | 构建 Docker 镜像 |
| `make up` | 启动容器（后台运行） |
| `make down` | 停止并删除容器 |
| `make logs` | 查看容器日志（实时） |
| `make pack` | 导出镜像为压缩包（.tar.gz） |
| `make build-and-pack` | **一键构建并打包** ⭐ |
| `make build-and-up` | **一键构建并启动** ⭐ |
| `make clean` | 清理生成的镜像包文件 |

> 💡 **提示**: 推荐使用标有 ⭐ 的命令，它们可以一步完成常用操作。

---

## 快速开始

### 方式一：使用 Docker Compose（推荐）

#### 使用 npm 脚本（最简单）

```bash
# 一键构建并启动
npm run docker:build-and-up

# 查看日志
npm run docker:logs

# 停止容器
npm run docker:down
```

#### 使用 Docker Compose 命令

```bash
# 构建并启动容器
docker-compose up -d --build

# 查看日志
docker-compose logs -f

# 停止容器
docker-compose down
```

应用将在 `http://localhost:3000` 访问。

### 方式二：使用 Docker 命令

```bash
# 构建镜像
docker build -t react-xiuxian-game:latest .

# 运行容器
docker run -d -p 3000:80 --name react-xiuxian-game react-xiuxian-game:latest

# 查看日志
docker logs -f react-xiuxian-game

# 停止容器
docker stop react-xiuxian-game

# 删除容器
docker rm react-xiuxian-game
```

## 构建参数

### 自动版本号

Docker构建脚本会自动从 `package.json` 读取版本号并注入到镜像中：

- **自动读取**: 使用 `npm run docker:build` 或 `make build` 时，会自动读取 `package.json` 中的版本号
- **版本号显示**: 版本号会显示在游戏设置界面中
- **镜像标签**: 版本号也会作为Docker镜像的LABEL标签

```bash
# 使用npm脚本（自动读取版本号）
npm run docker:build

# 使用Makefile（自动读取版本号）
make build
```

### 手动指定版本号

如果需要手动指定版本号，可以通过环境变量设置：

```bash
# 方式一：使用环境变量
VITE_APP_VERSION=0.1.6 docker-compose build

# 方式二：在.env文件中设置
# VITE_APP_VERSION=0.1.6

# 方式三：使用docker build命令
docker build \
  --build-arg VITE_APP_VERSION=0.1.6 \
  -t react-xiuxian-game:latest .
```

## 环境变量配置

**重要**：Vite 的环境变量（`VITE_` 前缀）需要在**构建时**注入，而不是运行时。这些变量会被打包到静态文件中。

### 配置步骤

1. **创建环境变量文件**

在项目根目录创建 `.env` 文件（或复制 `.env.example`）：

```bash
# AI 配置
VITE_AI_KEY=your_api_key_here
VITE_AI_PROVIDER=glm
VITE_AI_API_URL=https://your-api-url.com
VITE_AI_MODEL=your_model_name
VITE_AI_USE_PROXY=false
```

2. **使用 Docker Compose 构建**

Docker Compose 会自动读取 `.env` 文件中的变量：

```bash
# 构建并启动（会使用 .env 文件中的变量）
docker-compose up -d --build
```

3. **使用 Docker 命令构建**

如果使用 Docker 命令，需要手动传递构建参数：

```bash
# 构建镜像（传递构建时参数）
docker build \
  --build-arg VITE_AI_KEY="your_api_key" \
  --build-arg VITE_AI_PROVIDER="glm" \
  --build-arg VITE_AI_API_URL="https://your-api-url.com" \
  --build-arg VITE_AI_MODEL="your_model" \
  --build-arg VITE_AI_USE_PROXY="false" \
  -t react-xiuxian-game:latest .

# 运行容器
docker run -d -p 3000:80 --name react-xiuxian-game react-xiuxian-game:latest
```

### 环境变量说明

| 变量名 | 说明 | 必填 | 默认值 |
|--------|------|------|--------|
| `VITE_APP_VERSION` | 应用版本号（自动从package.json读取） | 否 | `0.1.0` |
| `VITE_AI_KEY` | AI API 密钥 | 是 | - |
| `VITE_AI_PROVIDER` | AI 服务提供商 (glm/openai/anthropic) | 否 | glm |
| `VITE_AI_API_URL` | 自定义 API 地址 | 否 | - |
| `VITE_AI_MODEL` | 自定义模型名称 | 否 | - |
| `VITE_AI_USE_PROXY` | 是否使用代理 | 否 | - |

### 验证配置

构建完成后，可以通过浏览器开发者工具检查环境变量是否正确打包：

```javascript
// 在浏览器控制台中检查
console.log(import.meta.env.VITE_AI_PROVIDER)
```

**安全提示**：不要在公开的仓库中提交包含敏感信息（如 API Key）的 `.env` 文件。

## 生产环境建议

1. **使用 HTTPS**：在生产环境中，建议在容器前使用反向代理（如 Traefik、Nginx）来处理 SSL/TLS。

2. **资源限制**：可以设置容器的资源限制：

```yaml
services:
  web:
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
```

3. **多阶段构建优化**：当前 Dockerfile 已经使用了多阶段构建，可以进一步优化镜像大小。

4. **健康检查**：容器已配置健康检查端点 `/health`，可以用于监控。

## 网络问题解决

如果遇到无法连接 Docker Hub 的问题（特别是在中国大陆地区），可以使用以下解决方案：

### 方案一：配置 Docker 镜像加速器（推荐）

#### Windows (Docker Desktop)
1. 打开 Docker Desktop
2. 进入 Settings → Docker Engine
3. 添加以下配置：
```json
{
  "registry-mirrors": [
    "https://docker.mirrors.ustc.edu.cn",
    "https://hub-mirror.c.163.com",
    "https://mirror.baidubce.com"
  ]
}
```
4. 点击 "Apply & Restart"

#### Linux
编辑 `/etc/docker/daemon.json`（如果不存在则创建）：
```json
{
  "registry-mirrors": [
    "https://docker.mirrors.ustc.edu.cn",
    "https://hub-mirror.c.163.com",
    "https://mirror.baidubce.com"
  ]
}
```
然后重启 Docker：
```bash
sudo systemctl daemon-reload
sudo systemctl restart docker
```

### 方案二：使用备用 Dockerfile（国内镜像版本）

如果配置镜像加速器后仍有问题，可以使用专门为中国网络优化的 Dockerfile：

```bash
# 使用国内镜像优化版本
docker build -f Dockerfile.cn -t react-xiuxian-game:latest .
```

或者使用构建参数指定镜像源：

```bash
# 使用 Azure 中国镜像
docker build \
  --build-arg NODE_IMAGE=dockerhub.azk8s.cn/library/node:20-alpine \
  --build-arg NGINX_IMAGE=dockerhub.azk8s.cn/library/nginx:alpine \
  -t react-xiuxian-game:latest .
```

### 方案三：使用代理

如果公司或网络环境有代理，可以配置 Docker 使用代理：

#### Windows (Docker Desktop)
Settings → Resources → Proxies → 配置代理服务器

#### Linux
创建 `/etc/systemd/system/docker.service.d/http-proxy.conf`：
```ini
[Service]
Environment="HTTP_PROXY=http://proxy.example.com:8080"
Environment="HTTPS_PROXY=http://proxy.example.com:8080"
Environment="NO_PROXY=localhost,127.0.0.1"
```

## 镜像打包与迁移

如果需要在没有网络连接的环境中部署，或者需要备份/传输镜像，可以将Docker镜像打包成tar文件。

### 导出镜像为 tar 包

**方式一：使用 npm 脚本（最简单）**

```bash
# 1. 一键构建并打包（推荐）
npm run docker:build-and-pack

# 这个命令会：
# - 构建 Docker 镜像
# - 导出为压缩的 .tar.gz 文件

# 或者分步执行：
# 先构建
npm run docker:build

# 再打包（压缩版本）
npm run docker:pack

# 或打包未压缩版本
npm run docker:pack-uncompressed
```

**方式二：使用 Docker 命令**

```bash
# 1. 先构建镜像
docker build \
  --build-arg VITE_AI_KEY="your_api_key" \
  --build-arg VITE_AI_PROVIDER="glm" \
  -t react-xiuxian-game:latest .

# 2. 导出为 tar 包
docker save -o react-xiuxian-game.tar react-xiuxian-game:latest

# 或者使用压缩格式（推荐，可以大幅减小文件大小）
docker save react-xiuxian-game:latest | gzip > react-xiuxian-game.tar.gz
```

**方式三：使用 Docker Compose 构建后导出**

```bash
# 1. 使用 Docker Compose 构建（会自动读取 .env 文件）
docker-compose build

# 2. 导出镜像
docker save -o react-xiuxian-game.tar react-xiuxian-game:latest

# 或压缩导出
docker save react-xiuxian-game:latest | gzip > react-xiuxian-game.tar.gz
```

### 导入 tar 包

在目标机器上导入镜像：

```bash
# 导入未压缩的 tar 包
docker load -i react-xiuxian-game.tar

# 导入压缩的 tar.gz 包
gunzip -c react-xiuxian-game.tar.gz | docker load

# 或者使用一条命令
docker load < react-xiuxian-game.tar.gz
```

### 验证导入的镜像

```bash
# 查看镜像列表
docker images | grep react-xiuxian-game

# 运行导入的镜像
docker run -d -p 3000:80 --name react-xiuxian-game react-xiuxian-game:latest
```

### 完整的打包流程示例

**使用 npm 脚本（推荐）：**

```bash
# 步骤1：创建 .env 文件并配置环境变量
cat > .env << EOF
VITE_AI_KEY=your_api_key
VITE_AI_PROVIDER=glm
EOF

# 步骤2：一键构建并打包
npm run docker:build-and-pack

# 步骤3：查看文件大小
ls -lh react-xiuxian-game.tar.gz

# 步骤4：传输文件到目标机器（示例）
# scp react-xiuxian-game.tar.gz user@target-server:/path/to/destination/
```

**使用 Docker 命令：**

```bash
# 步骤1：设置环境变量（创建 .env 文件或直接设置）
export VITE_AI_KEY="your_api_key"
export VITE_AI_PROVIDER="glm"

# 步骤2：构建镜像
docker-compose build
# 或使用 Docker 命令
# docker build --build-arg VITE_AI_KEY="$VITE_AI_KEY" -t react-xiuxian-game:latest .

# 步骤3：导出为压缩包
docker save react-xiuxian-game:latest | gzip > react-xiuxian-game.tar.gz

# 步骤4：查看文件大小
ls -lh react-xiuxian-game.tar.gz

# 步骤5：传输文件到目标机器（示例）
# scp react-xiuxian-game.tar.gz user@target-server:/path/to/destination/
```

### 在目标机器上部署

```bash
# 步骤1：导入镜像
docker load < react-xiuxian-game.tar.gz

# 步骤2：运行容器
docker run -d -p 3000:80 --name react-xiuxian-game react-xiuxian-game:latest

# 或使用 Docker Compose（需要同时传输 docker-compose.yml）
docker-compose up -d
```

### 文件大小优化建议

- **使用 gzip 压缩**：通常可以减少 50-70% 的文件大小
- **多阶段构建**：当前 Dockerfile 已使用多阶段构建，最终镜像只包含必要文件
- **清理不需要的层**：确保构建过程中没有遗留临时文件

```bash
# 比较压缩前后的大小
docker save react-xiuxian-game:latest -o react-xiuxian-game.tar
ls -lh react-xiuxian-game.tar

docker save react-xiuxian-game:latest | gzip > react-xiuxian-game.tar.gz
ls -lh react-xiuxian-game.tar.gz
```

## 故障排查

### 查看容器日志
```bash
docker logs react-xiuxian-game
```

### 进入容器调试
```bash
docker exec -it react-xiuxian-game sh
```

### 检查容器状态
```bash
docker ps -a
```

### 重新构建（不使用缓存）
```bash
docker build --no-cache -t react-xiuxian-game:latest .
```

### 测试镜像加速器是否生效
```bash
docker info | grep -A 10 "Registry Mirrors"
```

---

## 📚 相关文档

- [Docker 使用示例](DOCKER_EXAMPLES.md) - 包含常见场景的完整示例
- [README](README.md) - 项目主文档
- [更新日志](CHANGELOG.md) - 版本更新历史

