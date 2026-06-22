/**
 * 调试模式可用性判断
 * 仅允许本地开发环境启用调试功能，生产环境强制关闭。
 */
export function isDebugFeatureAvailable(): boolean {
  if (!import.meta.env.DEV) return false;
  if (typeof window === 'undefined') return true;

  const host = window.location.hostname;
  if (host === 'localhost' || host === '127.0.0.1' || host === '::1') return true;
  if (host.endsWith('.local')) return true;

  // 局域网地址（本地联调常见）
  if (/^10\./.test(host)) return true;
  if (/^192\.168\./.test(host)) return true;
  if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(host)) return true;

  return false;
}

