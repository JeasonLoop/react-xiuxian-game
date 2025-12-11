/**
 * 统一的日志工具
 * 在生产环境中自动禁用 console.log 和 console.warn
 * console.error 始终记录，用于错误追踪
 */

const isDev = import.meta.env.DEV;

export const logger = {
  /**
   * 开发环境日志
   * 生产环境自动禁用
   */
  log: (...args: unknown[]) => {
    if (isDev) {
      console.log(...args);
    }
  },

  /**
   * 警告日志
   * 生产环境自动禁用
   */
  warn: (...args: unknown[]) => {
    if (isDev) {
      console.warn(...args);
    }
  },

  /**
   * 错误日志
   * 始终记录，用于错误追踪
   */
  error: (...args: unknown[]) => {
    console.error(...args);
    // 这里可以集成错误追踪服务，如 Sentry
    // if (import.meta.env.PROD) {
    //   Sentry.captureException(new Error(String(args[0])));
    // }
  },

  /**
   * 调试日志
   * 仅在开发环境且启用调试模式时记录
   */
  debug: (...args: unknown[]) => {
    if (isDev) {
      const DEBUG_MODE_KEY = 'xiuxian-debug-mode';
      const debugMode = localStorage.getItem(DEBUG_MODE_KEY) === 'true';
      if (debugMode) {
        console.debug(...args);
      }
    }
  },
};

