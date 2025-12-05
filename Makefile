.PHONY: help build up down logs pack build-and-pack build-and-up clean

# 默认目标：显示帮助信息
help:
	@echo "🐳 Docker 快捷命令"
	@echo ""
	@echo "使用方法: make [target]"
	@echo ""
	@echo "可用命令:"
	@echo "  make build           - 构建 Docker 镜像"
	@echo "  make up              - 启动容器（后台运行）"
	@echo "  make down            - 停止并删除容器"
	@echo "  make logs            - 查看容器日志"
	@echo "  make pack            - 导出镜像为压缩包"
	@echo "  make build-and-pack  - 一键构建并打包 ⭐"
	@echo "  make build-and-up    - 一键构建并启动 ⭐"
	@echo "  make clean           - 清理生成的镜像包文件"
	@echo ""
	@echo "💡 提示: 确保已创建 .env 文件并配置环境变量"

# 构建镜像
build:
	@echo "🔨 正在构建 Docker 镜像..."
	docker-compose build

# 启动容器
up:
	@echo "🚀 正在启动容器..."
	docker-compose up -d
	@echo "✅ 容器已启动，访问: http://localhost:3000"

# 停止容器
down:
	@echo "🛑 正在停止容器..."
	docker-compose down
	@echo "✅ 容器已停止"

# 查看日志
logs:
	@echo "📋 查看容器日志 (Ctrl+C 退出)..."
	docker-compose logs -f

# 打包镜像
pack:
	@echo "📦 正在打包 Docker 镜像..."
	docker save react-xiuxian-game:latest | gzip > react-xiuxian-game.tar.gz
	@echo "✅ 打包完成: react-xiuxian-game.tar.gz"
	@ls -lh react-xiuxian-game.tar.gz

# 一键构建并打包
build-and-pack: build pack
	@echo "🎉 构建并打包完成！"

# 一键构建并启动
build-and-up:
	@echo "🔨 正在构建并启动..."
	docker-compose up -d --build
	@echo "✅ 完成！访问: http://localhost:3000"

# 清理生成的文件
clean:
	@echo "🧹 正在清理..."
	@rm -f react-xiuxian-game.tar.gz react-xiuxian-game.tar
	@echo "✅ 清理完成"

