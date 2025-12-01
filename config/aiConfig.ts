/**
 * AI 服务配置
 * 支持多种 AI 服务提供商，通过环境变量轻松切换
 *
 * 默认使用 SiliconFlow 作为 AI 接口
 * 如需切换，设置环境变量 VITE_AI_PROVIDER
 */

export type AIProvider = 'siliconflow' | 'openai' | 'glm' | 'custom';

export interface AIConfig {
  provider: AIProvider;
  apiKey: string;
  apiUrl: string;
  model: string;
  useProxy: boolean; // 是否使用代理（开发环境）
  proxyPath?: string; // 代理路径
}

// 预设的 AI 服务配置
const AI_PROVIDERS: Record<
  AIProvider,
  {
    defaultUrl: string;
    defaultModel: string;
    proxyPath: string;
  }
> = {
  siliconflow: {
    defaultUrl: 'https://api.siliconflow.cn/v1/chat/completions',
    defaultModel: 'Qwen/Qwen2.5-72B-Instruct',
    proxyPath: '/api/v1/chat/completions',
  },
  openai: {
    defaultUrl: 'https://api.openai.com/v1/chat/completions',
    defaultModel: 'gpt-3.5-turbo',
    proxyPath: '/api/v1/chat/completions',
  },
  glm: {
    defaultUrl: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
    defaultModel: 'glm-4.5',
    proxyPath: '/api/paas/v4/chat/completions',
  },
  custom: {
    defaultUrl: '',
    defaultModel: '',
    proxyPath: '/api/v1/chat/completions',
  },
};

/**
 * 获取 AI 配置
 */
export function getAIConfig(): AIConfig {
  const isDev = import.meta.env.DEV;

  // 从环境变量获取配置
  const provider = (import.meta.env.VITE_AI_PROVIDER ||
    'glm') as AIProvider;
  const apiKey = import.meta.env.VITE_AI_KEY || '';
  const customApiUrl = import.meta.env.VITE_AI_API_URL;
  const customModel = import.meta.env.VITE_AI_MODEL;
  const proxyPreference = import.meta.env.VITE_AI_USE_PROXY;

  // 获取预设配置
  const providerConfig = AI_PROVIDERS[provider] || AI_PROVIDERS.glm;

  // 构建配置
  const apiUrl = providerConfig.defaultUrl;
  const model = customModel || providerConfig.defaultModel;
  const proxyPath = providerConfig.proxyPath;

  // 是否应该使用内置代理路径
  let shouldUseProxy = false;
  if (!customApiUrl) {
    if (proxyPreference === 'true') {
      // 显式开启（适用于 Vercel 等生产环境）
      shouldUseProxy = true;
    } else if (proxyPreference === 'false') {
      shouldUseProxy = false;
    } else {
      // 未设置时，开发环境默认开启代理，生产环境默认关闭
      shouldUseProxy = isDev;
    }
  }

  // 确定最终使用的 URL
  let finalApiUrl: string;
  if (customApiUrl) {
    finalApiUrl = customApiUrl;
  } else if (shouldUseProxy) {
    finalApiUrl = proxyPath;
  } else {
    finalApiUrl = apiUrl;
  }

  return {
    provider,
    apiKey,
    apiUrl: finalApiUrl,
    model,
    useProxy: shouldUseProxy,
    proxyPath,
  };
}

/**
 * 验证配置
 */
export function validateAIConfig(config: AIConfig): {
  valid: boolean;
  error?: string;
} {
  if (!config.apiKey) {
    return {
      valid: false,
      error:
        'VITE_AI_KEY 环境变量未设置。请创建 .env.local 文件并配置 API Key。',
    };
  }

  if (!config.apiUrl) {
    return {
      valid: false,
      error: 'API URL 未配置。请设置 VITE_AI_API_URL 环境变量。',
    };
  }

  if (!config.model) {
    return {
      valid: false,
      error: 'AI 模型未配置。请设置 VITE_AI_MODEL 环境变量。',
    };
  }

  return { valid: true };
}

/**
 * 获取配置信息（用于调试）
 */
export function getAIConfigInfo(): string {
  const config = getAIConfig();
  const validation = validateAIConfig(config);

  return `
AI 服务配置:
- 提供商: ${config.provider}
- API URL: ${config.apiUrl}
- 模型: ${config.model}
- 使用代理: ${config.useProxy}
- API Key: ${config.apiKey ? '已设置' : '未设置'}
- 配置状态: ${validation.valid ? '✅ 有效' : '❌ 无效'}
${validation.error ? `- 错误: ${validation.error}` : ''}
  `.trim();
}
