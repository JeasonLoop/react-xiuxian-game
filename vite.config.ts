import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { codeInspectorPlugin } from 'code-inspector-plugin';

export default defineConfig({
  base: '/', // Vercel 部署使用根路径
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
