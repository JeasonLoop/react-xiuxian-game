# 第一阶段：构建应用
FROM node:20-alpine AS builder

# 设置工作目录
WORKDIR /app

# 复制 package.json 和 package-lock.json（如果存在）
COPY package*.json ./

# 使用npm安装依赖，国内镜像源提高成功率
RUN npm config set registry https://registry.npmmirror.com && \
    npm ci || npm install

# 复制源代码
COPY . .

# 声明构建时参数（Build Arguments）
ARG VITE_APP_VERSION
ARG VITE_API_BASE_URL
ARG VITE_PARTYKIT_HOST

# 将构建参数设置为环境变量，供 Vite 构建时使用
ENV VITE_APP_VERSION=$VITE_APP_VERSION
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_PARTYKIT_HOST=$VITE_PARTYKIT_HOST

# 添加版本号标签到镜像
LABEL version="${VITE_APP_VERSION}"
LABEL org.opencontainers.image.version="${VITE_APP_VERSION}"

# 构建应用
RUN npm run build

# 第二阶段：使用 nginx 提供静态文件服务
FROM nginx:alpine

# 复制构建产物到 nginx 目录
COPY --from=builder /app/dist /usr/share/nginx/html

# 复制自定义 nginx 配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 暴露端口
EXPOSE 80

# 启动 nginx
CMD ["nginx", "-g", "daemon off;"]

