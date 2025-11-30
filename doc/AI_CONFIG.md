# AI 配置指南

## 快速配置

### 1. 创建环境变量文件

在项目根目录创建 `.env.local` 文件：

```bash
# 选择 AI 提供商（siliconflow | openai | custom）
VITE_AI_PROVIDER=siliconflow

# 设置 API Key（必需）
VITE_AI_KEY=your-api-key-here

# 可选：自定义模型
VITE_AI_MODEL=Qwen/Qwen2.5-72B-Instruct

# 可选：自定义 API URL（如果设置则覆盖提供商默认 URL）
# VITE_AI_API_URL=https://api.siliconflow.cn/v1/chat/completions

# 可选：是否通过 /api 代理
# 未设置时：开发环境默认 true，生产环境默认 false
# 显式设置为 true 可在 Vercel 等环境走 /api 代理
# 显式设置为 false 则无论环境都直连远程 API
# VITE_AI_USE_PROXY=true
```

### 2. 重启开发服务器

```bash
pnpm dev
```

## 支持的提供商

### SiliconFlow（推荐）

**配置**:

```bash
VITE_AI_PROVIDER=siliconflow
VITE_AI_KEY=your-siliconflow-key
VITE_AI_MODEL=Qwen/Qwen2.5-72B-Instruct
```

**获取 API Key**: https://siliconflow.cn

**特点**:

- 国内访问速度快
- 支持多种开源模型
- 价格相对便宜

### OpenAI

**配置**:

```bash
VITE_AI_PROVIDER=openai
VITE_AI_KEY=sk-your-openai-key
VITE_AI_MODEL=gpt-3.5-turbo
```

**获取 API Key**: https://platform.openai.com

**特点**:

- 模型质量高
- 需要科学上网（国内）
- 价格相对较高

### 自定义服务

**配置**:

```bash
VITE_AI_PROVIDER=custom
VITE_AI_KEY=your-custom-key
VITE_AI_API_URL=https://your-api.com/v1/chat/completions
VITE_AI_MODEL=your-model-name
```

**要求**:

- API 必须兼容 OpenAI API 格式
- 支持 POST `/v1/chat/completions` 端点
- 使用 Bearer token 认证

## 故障排查

### 404 错误（或 CORS 错误）

**原因**: API 路径不正确

**解决方法**:

1. 检查 `VITE_AI_API_URL` 是否正确
2. 确保路径包含 `/v1/chat/completions`
3. 开发环境推荐 `VITE_AI_USE_PROXY=true`（默认即为 true，可避免 CORS）
4. 检查浏览器控制台的网络请求，查看实际请求的 URL

### 401 错误

**原因**: API Key 无效或缺失

**解决方法**:

1. 检查 `.env.local` 文件是否存在
2. 检查 `VITE_AI_KEY` 是否正确
3. 重启开发服务器（环境变量更改后需要重启）
4. 验证 API Key 是否有效

### 跨域错误

**原因**: 直接请求 API 时遇到 CORS 限制

**解决方法**:

1. 开发环境：设置 `VITE_AI_USE_PROXY=true`（使用 Vite 代理）
2. 生产环境：使用 Vercel Function 代理（已配置）
3. 如果 API 支持 CORS，可以设置 `VITE_AI_USE_PROXY=false`

### 代理不工作

**原因**: Vite 代理配置问题

**解决方法**:

1. 检查 `vite.config.ts` 中的代理配置
2. 确保代理目标 URL 正确
3. 检查端口是否正确（默认 5173）
4. 查看 Vite 控制台的代理日志

## 调试技巧

### 查看配置信息

在浏览器控制台运行：

```javascript
// 查看当前配置（需要在代码中添加）
console.log('AI Config:', window.__AI_CONFIG__);
```

### 检查网络请求

1. 打开浏览器开发者工具（F12）
2. 切换到 Network 标签
3. 筛选 XHR/Fetch 请求
4. 查看请求 URL、状态码和响应

### 测试 API

使用 curl 测试：

```bash
# 开发环境（通过代理）
curl 'http://localhost:5173/api/v1/chat/completions' \
  -H 'Authorization: Bearer your-api-key' \
  -H 'Content-Type: application/json' \
  -d '{"model":"Qwen/Qwen2.5-72B-Instruct","messages":[{"role":"user","content":"Hello"}]}'

# 直接请求（如果 API 支持 CORS）
curl 'https://api.siliconflow.cn/v1/chat/completions' \
  -H 'Authorization: Bearer your-api-key' \
  -H 'Content-Type: application/json' \
  -d '{"model":"Qwen/Qwen2.5-72B-Instruct","messages":[{"role":"user","content":"Hello"}]}'
```

## 切换提供商

只需修改 `.env.local` 文件：

```bash
# 从 SiliconFlow 切换到 OpenAI
VITE_AI_PROVIDER=openai
VITE_AI_KEY=sk-your-openai-key
VITE_AI_MODEL=gpt-3.5-turbo
```

然后重启开发服务器。

## 相关文件

- `config/aiConfig.ts` - 配置系统核心代码
- `config/README.md` - 配置系统详细说明
- `.env.example` - 环境变量模板
- `vite.config.ts` - 开发环境代理配置
- `api/proxy.js` - 生产环境代理配置
