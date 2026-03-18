#!/bin/bash
set -e

# ============================================
# 云灵修仙传 - 一键部署脚本 (腾讯云)
# 用途：自动化部署全栈应用（前端 + 后端云存档）
# 特性：依赖缓存，仅在依赖变化时重新安装
# ============================================

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}===========================================${NC}"
echo -e "${GREEN}   云灵修仙传 一键部署脚本${NC}"
echo -e "${GREEN}   域名: ylxiuxian.jeasonloop.online${NC}"
echo -e "${GREEN}===========================================${NC}"
echo ""

# 检查是否在项目根目录
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ 错误: 请在项目根目录运行此脚本${NC}"
    echo "   当前目录: $(pwd)"
    exit 1
fi

# 加载环境变量
# 按优先级查找: .env > .env.production > .env.production.full.example
if [ -f ".env" ]; then
    echo -e "${YELLOW}📄 加载环境变量文件 .env${NC}"
    export $(grep -v '^#' .env | xargs)
elif [ -f ".env.production" ]; then
    echo -e "${YELLOW}📄 加载环境变量文件 .env.production${NC}"
    export $(grep -v '^#' .env.production | xargs)
else
    echo -e "${YELLOW}⚠️  未找到环境变量文件，使用示例配置创建 .env...${NC}"
    cp .env.production.full.example .env
    echo -e "${YELLOW}✅ 已创建 .env，请检查并修改配置后重新部署${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}🔍 检查依赖是否需要更新...${NC}"

# 检查是否需要重新安装依赖
# 对比 package.json 和 node_modules 的修改时间
NEED_INSTALL=false
if [ ! -d "node_modules" ]; then
    NEED_INSTALL=true
elif [ "package.json" -nt "node_modules" ]; then
    NEED_INSTALL=true
fi

# 检查 server/package.json
if [ -d "server" ]; then
    if [ ! -d "server/node_modules" ]; then
        NEED_INSTALL=true
    elif [ "server/package.json" -nt "server/node_modules" ]; then
        NEED_INSTALL=true
    fi
fi

if [ "$NEED_INSTALL" = true ]; then
    echo -e "${YELLOW}📦 依赖已变化，执行 npm install...${NC}"
    npm install
    if [ -d "server" ]; then
        cd server && npm install && cd ..
    fi
    echo -e "${GREEN}✅ 依赖安装完成${NC}"
else
    echo -e "${GREEN}✅ 依赖未变化，跳过 npm install${NC}"
fi

echo ""
echo -e "${YELLOW}🐳 开始 Docker 构建和部署...${NC}"

# 检测 docker-compose v1 vs docker compose v2
# 有些系统 docker-compose 文件存在但损坏，所以需要验证
DOCKER_COMPOSE="docker compose"
if command -v docker-compose >/dev/null 2>&1; then
    # 测试一下是否能正常运行
    if docker-compose --version >/dev/null 2>&1; then
        DOCKER_COMPOSE="docker-compose"
    fi
fi

echo "🔍 使用命令: $DOCKER_COMPOSE"

# 使用 docker-compose 构建并启动
$DOCKER_COMPOSE -f docker-compose.full.yml --env-file "$(pwd)/.env" up -d --build

echo ""
echo -e "${GREEN}===========================================${NC}"
echo -e "${GREEN}✅ 部署完成！${NC}"
echo -e "${GREEN}===========================================${NC}"
echo ""
echo "SSL证书要求："
echo "   请将你的SSL证书上传到项目 ssl/ 目录："
echo "   - ssl/fullchain.crt  (证书链)"
echo "   - ssl/privkey.key   (私钥)"
echo "   上传后重新运行 ./deploy.sh 即可生效"
echo ""
echo "访问地址："
echo "   🌐 HTTPS: https://ylxiuxian.jeasonloop.online:8443"
echo "   🔀 HTTP:  http://ylxiuxian.jeasonloop.online:8080  → 自动跳转 HTTPS"
echo "   🔌 API: https://ylxiuxian.jeasonloop.online:8443/api"
echo ""
echo "查看日志："
echo "   $DOCKER_COMPOSE -f docker-compose.full.yml logs -f"
echo "   $DOCKER_COMPOSE -f docker-compose.full.yml logs -f backend  # 仅查看后端日志"
echo "   $DOCKER_COMPOSE -f docker-compose.full.yml logs -f web     # 仅查看前端日志"
echo ""
echo "停止服务："
echo "   $DOCKER_COMPOSE -f docker-compose.full.yml down"
echo ""

# 检测 docker-compose v1 vs docker compose v2
if command -v docker-compose >/dev/null 2>&1; then
    if docker-compose --version >/dev/null 2>&1; then
        DOCKER_COMPOSE="docker-compose"
    else
        DOCKER_COMPOSE="docker compose"
    fi
else
    DOCKER_COMPOSE="docker compose"
fi

# 显示容器状态
echo -e "${YELLOW}📊 当前容器状态:${NC}"
$DOCKER_COMPOSE -f docker-compose.full.yml ps
