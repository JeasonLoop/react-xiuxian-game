# 第一阶段：构建应用
FROM node:20-alpine AS builder

# 设置工作目录
WORKDIR /app

# 复制 package.json 和 package-lock.json（如果存在）
COPY package*.json ./
COPY pnpm-lock.yaml* ./

# 安装依赖
# 优先使用 pnpm（如果存在 lock 文件），否则使用 npm
RUN if [ -f pnpm-lock.yaml ]; then \
      npm install -g pnpm && \
      pnpm install --frozen-lockfile; \
    else \
      npm ci; \
    fi

# 复制源代码
COPY . .

# 声明构建时参数（Build Arguments）
ARG VITE_AI_KEY
ARG VITE_AI_MODEL
ARG VITE_AI_API_URL
ARG VITE_AI_PROVIDER
ARG VITE_AI_USE_PROXY

# 将构建参数设置为环境变量，供 Vite 构建时使用
ENV VITE_AI_KEY=$VITE_AI_KEY
ENV VITE_AI_MODEL=$VITE_AI_MODEL
ENV VITE_AI_API_URL=$VITE_AI_API_URL
ENV VITE_AI_PROVIDER=$VITE_AI_PROVIDER
ENV VITE_AI_USE_PROXY=$VITE_AI_USE_PROXY

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

