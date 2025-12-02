// Vercel Serverless Function - API 代理
// 支持动态配置 AI 服务提供商

/**
 * 获取代理目标 URL
 */
function getProxyTarget() {
  // 从环境变量获取配置
  const customUrl = process.env.VITE_AI_API_URL;
  if (customUrl) {
    try {
      const url = new URL(customUrl);
      return url.origin;
    } catch {
      // 如果解析失败，使用默认值
    }
  }

  // 根据提供商选择目标
  const provider = process.env.VITE_AI_PROVIDER || 'glm';
  switch (provider) {
    case 'openai':
      return 'https://api.openai.com';
    case 'glm':
      return 'https://open.bigmodel.cn';
    case 'siliconflow':
    default:
      return 'https://api.siliconflow.cn';
  }
}

export default async function handler(req, res) {
  // 设置 CORS 头（必须在最前面）
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Max-Age', '86400'); // 24小时

  // 处理 OPTIONS 预检请求
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 只允许 POST 方法
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 从服务器端环境变量获取 API Key（安全：不暴露给前端）
    const apiKey = process.env.VITE_AI_KEY;
    if (!apiKey) {
      return res.status(500).json({
        error: 'API Key not configured',
        message: 'VITE_AI_KEY environment variable is not set on the server',
      });
    }

    // 从请求路径中提取实际路径（去掉 /api 前缀）
    // 根据提供商选择默认路径
    const provider = process.env.VITE_AI_PROVIDER || 'glm';
    const defaultPath = provider === 'glm'
      ? '/api/paas/v4/chat/completions'
      : '/v1/chat/completions';
    const apiPath = req.url.replace(/^\/api/, '') || defaultPath;
    const targetBase = getProxyTarget();
    const targetUrl = `${targetBase}${apiPath}`;

    // 使用服务器端的 API Key，而不是客户端传来的（安全）
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();

    // 返回响应
    return res.status(response.status).json(data);
  } catch (error) {
    console.error('Proxy error:', error);
    return res.status(500).json({
      error: 'Proxy request failed',
      message: error.message,
    });
  }
}

// Vercel Function 配置
export const config = {
  api: {
    bodyParser: true,
  },
};
