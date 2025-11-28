import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { codeInspectorPlugin } from "code-inspector-plugin";

// 从环境变量获取代理目标，默认使用 SiliconFlow
const getProxyTarget = () => {
  const customUrl = process.env.VITE_AI_API_URL;
  if (customUrl) {
    // 从完整 URL 中提取基础 URL
    try {
      const url = new URL(customUrl);
      return url.origin;
    } catch {
      // 如果解析失败，使用默认值
    }
  }

  // 根据提供商选择目标
  const provider = process.env.VITE_AI_PROVIDER || 'siliconflow';
  switch (provider) {
    case 'openai':
      return 'https://api.openai.com';
    case 'siliconflow':
      return 'https://api.siliconflow.cn';
    default:
      return 'https://api.siliconflow.cn';
  }
};

export default defineConfig({
  base: "/", // Vercel 部署使用根路径
  server: {
    proxy: {
      '/api': {
        target: getProxyTarget(),
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, res) => {
            console.error('代理错误:', err);
          });
        },
      }
    }
  },
  plugins: [
    codeInspectorPlugin({
      bundler: "vite",
      hotKeys: ["altKey"],
    }),
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
