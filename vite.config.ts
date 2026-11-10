 import path from 'path';
 import { readFileSync } from 'node:fs';
 import { defineConfig } from 'vite';
 import react from '@vitejs/plugin-react';
 import { codeInspectorPlugin } from 'code-inspector-plugin';
 
 // 版本号单一来源：package.json（此前 .env 手写 VITE_APP_VERSION 导致与实际版本不同步）
 const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'));
 
 export default defineConfig({
   define: {
     'import.meta.env.VITE_APP_VERSION': JSON.stringify(pkg.version),
   },
  server: {
    port: 5175,
    strictPort: false, // 端口被占用时自动切换到下一个可用端口
    watch: {
      ignored: ['**/database.sqlite', '**/database.sqlite-*'],
    },
  },
  plugins: [
    codeInspectorPlugin({
      bundler: 'vite',
      hotKeys: ['altKey'],
    }),
    react(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
      '@hooks': path.resolve(__dirname, './hooks'),
      '@services': path.resolve(__dirname, './services'),
      '@utils': path.resolve(__dirname, './utils'),
      '@types': path.resolve(__dirname, './types'),
      '@constants': path.resolve(__dirname, './constants'),
      '@components': path.resolve(__dirname, './components'),
      '@views': path.resolve(__dirname, './views'),
      '@assets': path.resolve(__dirname, './assets'),
      '@styles': path.resolve(__dirname, './styles'),
    },
  },
});
