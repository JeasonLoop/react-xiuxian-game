# AI 配置说明

本目录包含 AI 服务的配置系统，支持多种 AI 服务提供商，方便切换和调整。

**默认配置**: 项目默认使用 **SiliconFlow** 作为 AI 接口，无需额外配置即可使用。

## 快速开始

### 1. 配置环境变量

创建 `.env.local` 文件（参考 `.env.example`）：

```bash
# AI 提供商（可选，默认: siliconflow）
# 如果不设置，将自动使用 SiliconFlow
# VITE_AI_PROVIDER=siliconflow

# 设置 API Key（必需）
VITE_AI_KEY=your-api-key-here

# 可选：自定义模型（默认: Qwen/Qwen2.5-72B-Instruct）
# VITE_AI_MODEL=Qwen/Qwen2.5-72B-Instruct
```

**最小配置**: 只需设置 `VITE_AI_KEY`，其他配置使用默认值（SiliconFlow）。

### 2. 支持的提供商

#### SiliconFlow (推荐)

```bash
VITE_AI_PROVIDER=siliconflow
VITE_AI_KEY=your-siliconflow-key
VITE_AI_MODEL=Qwen/Qwen2.5-72B-Instruct
```

**获取 API Key**: https://siliconflow.cn

#### OpenAI

```bash
VITE_AI_PROVIDER=openai
VITE_AI_KEY=your-openai-key
VITE_AI_MODEL=gpt-3.5-turbo
```

**获取 API Key**: https://platform.openai.com

#### 自定义服务

```bash
VITE_AI_PROVIDER=custom
VITE_AI_KEY=your-custom-key
VITE_AI_API_URL=https://your-api.com/v1/chat/completions
VITE_AI_MODEL=your-model-name
```

## 配置选项

### 必需配置

- `VITE_AI_KEY`: API Key（必需）

### 可选配置

- `VITE_AI_PROVIDER`: 提供商 (`siliconflow` | `openai` | `custom`)，默认 `siliconflow`
- `VITE_AI_MODEL`: 模型名称，根据提供商使用默认值
- `VITE_AI_API_URL`: 完整 API URL，如果设置则覆盖提供商默认 URL
- `VITE_AI_USE_PROXY`: 是否使用代理（开发环境），默认 `true`

## 使用示例

### 在代码中使用

```typescript
import { getAIConfig, validateAIConfig } from '../config/aiConfig';

const config = getAIConfig();
const validation = validateAIConfig(config);

if (validation.valid) {
  // 使用 config.apiUrl, config.apiKey, config.model
} else {
  console.error(validation.error);
}
```

## 切换提供商

只需修改 `.env.local` 文件中的 `VITE_AI_PROVIDER` 和对应的 `VITE_AI_KEY`：

```bash
# 从 SiliconFlow 切换到 OpenAI
VITE_AI_PROVIDER=openai
VITE_AI_KEY=sk-your-openai-key
VITE_AI_MODEL=gpt-3.5-turbo
```

重启开发服务器即可生效。

## 故障排查

### 404 错误

1. 检查 `VITE_AI_API_URL` 是否正确
2. 检查代理配置（`vite.config.ts`）
3. 检查路径是否正确（应该是 `/v1/chat/completions`）

### 401 错误

1. 检查 `VITE_AI_KEY` 是否正确
2. 检查 API Key 是否有效
3. 检查 API Key 是否有足够的配额

### 跨域错误

1. 确保 `VITE_AI_USE_PROXY=true`（开发环境）
2. 检查 `vite.config.ts` 中的代理配置
3. 生产环境使用 Vercel Function 代理

## 添加新提供商

在 `config/aiConfig.ts` 中添加新提供商：

```typescript
const AI_PROVIDERS: Record<AIProvider, {...}> = {
  // ... 现有提供商
  newprovider: {
    defaultUrl: 'https://api.newprovider.com/v1/chat/completions',
    defaultModel: 'default-model',
    proxyPath: '/api/v1/chat/completions',
  },
};
```

然后在 `vite.config.ts` 和 `api/proxy.js` 中添加对应的代理目标。
