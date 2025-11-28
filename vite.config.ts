import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { codeInspectorPlugin } from "code-inspector-plugin";

export default defineConfig({
  base: "/", // Vercel 部署使用根路径
  server: {
    proxy: {
      "/api": {
        target: "https://spark-api-open.xf-yun.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
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
