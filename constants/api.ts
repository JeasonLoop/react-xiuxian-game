/**
 * 后端 API 基础地址（登录、云存档等）
 * 开发默认 localhost:3001，生产可通过 VITE_API_BASE_URL 配置
 */
export const API_BASE_URL =
  import.meta.env?.VITE_API_BASE_URL ?? 'http://localhost:3001';

// 如果 API_BASE_URL 已经以 /api 结尾，就不需要再加了
// 否则加上 /api 路径前缀
const trimmed = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
export const API_URL = trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
