/**
 * 后端 API 基础地址（登录、云存档等）
 * 开发默认 localhost:3001，生产可通过 VITE_API_BASE_URL 配置
 */
export const API_BASE_URL =
  import.meta.env?.VITE_API_BASE_URL ?? 'http://localhost:3001';

export const API_URL = `${API_BASE_URL}/api`;
