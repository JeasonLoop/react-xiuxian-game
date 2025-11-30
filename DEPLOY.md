# Vercel 部署指南

## 🚀 快速部署

### 方法一：通过 Vercel Dashboard（推荐）

1. **登录 Vercel**
   - 访问 [vercel.com](https://vercel.com)
   - 使用 GitHub 账号登录

2. **导入项目**
   - 点击 "Add New..." → "Project"
   - 选择你的 GitHub 仓库 `react-xiuxian-game`
   - 点击 "Import"

3. **配置项目**
   - **Framework Preset**: Vite
   - **Root Directory**: `./`
   - **Build Command**: `npm run build` 或 `pnpm build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install` 或 `pnpm install`

4. **部署**
   - 点击 "Deploy" 按钮
   - 等待构建完成（约 1-2 分钟）
   - 部署成功后会得到一个 `.vercel.app` 域名

### 方法二：通过 Vercel CLI

1. **安装 Vercel CLI**

   ```bash
   npm install -g vercel
   ```

2. **登录 Vercel**

   ```bash
   vercel login
   ```

3. **部署项目**

   ```bash
   vercel
   ```

4. **部署到生产环境**
   ```bash
   vercel --prod
   ```

## 🔧 跨域问题解决方案

本项目使用 **Vercel Serverless Function** 来解决 API 跨域问题：

- **开发环境**: Vite dev server 代理 `/api` → `https://spark-api-open.xf-yun.com`
- **生产环境**: Vercel Serverless Function (`/api/proxy`) 代理所有 API 请求

### 工作原理

```
浏览器请求: /api/v2/chat/completions
       ↓
Vercel Serverless Function (api/proxy.js):
  - 接收请求
  - 转发到 https://spark-api-open.xf-yun.com/v2/chat/completions
  - 添加 CORS 头
       ↓
讯飞星火 API: 处理请求并返回结果
       ↓
Vercel Function: 返回给浏览器（带正确的 CORS 头）
```

这样浏览器只与同源的 Vercel 服务器通信，完全避免了跨域问题。

### 技术细节

- 使用 Vercel Serverless Function 而不是简单的 rewrites
- 自动转发 `Authorization` 头和请求体
- 添加正确的 CORS 响应头
- 支持 OPTIONS 预检请求

## 📝 环境变量（可选）

如果想使用环境变量管理 API Key（更安全），可以在 Vercel Dashboard 设置：

1. 进入项目设置 → Environment Variables
2. 添加以下变量：
   - `VITE_AI_API_KEY`: 你的讯飞星火 API Key
   - `VITE_AI_API_URL`: `/api/v2/chat/completions`（可选）
   - `VITE_AI_MODEL`: `spark-x`（可选）

3. 重新部署项目

**注意**: 目前 API Key 已硬编码在代码中，如需更高安全性，建议：

- 将 API Key 移到环境变量
- 不要将 API Key 提交到 Git 仓库
- 使用 `.env.local` 文件存储敏感信息

## 🔍 验证部署

部署成功后：

1. 访问你的 Vercel 域名
2. 尝试进行游戏操作（如历练）
3. 打开浏览器开发者工具（F12）
4. 检查 Network 标签，确认 API 请求成功

## ⚠️ 注意事项

1. **首次加载可能较慢**: Vercel 的 Serverless Functions 有冷启动时间
2. **API 限流**: 注意讯飞星火 API 的调用限制
3. **API Key 安全**: 建议使用环境变量而非硬编码
4. **自动部署**: 每次 push 到 main 分支都会自动触发部署

## 🛠️ 故障排查

### API 请求失败

- 检查 Vercel 函数日志
- 确认 API Key 是否有效
- 检查 API 配额是否用完

### 页面 404

- 确认 `vercel.json` 配置正确
- 检查 build 输出目录是否为 `dist`

### 跨域错误

- 确认 `vercel.json` 中的 rewrites 配置正确
- 检查请求路径是否以 `/api` 开头

## 📚 相关文档

- [Vercel 官方文档](https://vercel.com/docs)
- [Vite 部署指南](https://vitejs.dev/guide/static-deploy.html)
- [讯飞星火 API 文档](https://www.xfyun.cn/doc/spark/Web.html)
