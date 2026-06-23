/**
 * 版本检测 hook
 * 启动时检查 GitHub 最新版本，检测到新版本时自动刷新页面以加载最新资源
 */

import { useEffect, useRef } from 'react';

const GITHUB_API =
  'https://api.github.com/repos/JeasonLoop/react-xiuxian-game/releases/latest';
const CHECK_KEY = 'xiuxian-version-checked';

/** 获取当前版本号 */
function getCurrentVersion(): string {
  return import.meta.env.VITE_APP_VERSION || '0.0.0';
}

/** 比较版本号 */
function isNewerVersion(latest: string, current: string): boolean {
  const l = latest.replace(/^v/, '').split('.').map(Number);
  const c = current.replace(/^v/, '').split('.').map(Number);
  for (let i = 0; i < Math.max(l.length, c.length); i++) {
    const lv = l[i] || 0;
    const cv = c[i] || 0;
    if (lv > cv) return true;
    if (lv < cv) return false;
  }
  return false;
}

export function useVersionCheck(): void {
  // 确保每 session 只检查一次
  const checkedRef = useRef(false);

  useEffect(() => {
    if (checkedRef.current) return;
    checkedRef.current = true;

    const current = getCurrentVersion();

    // 上次检查已经是最新版，跳过
    if (localStorage.getItem(CHECK_KEY) === current) return;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    fetch(GITHUB_API, {
      signal: controller.signal,
      headers: { Accept: 'application/vnd.github.v3+json' },
    })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data: any) => {
        const latest = (data.tag_name || data.name || '').replace(/^v/, '');
        if (isNewerVersion(latest, current)) {
          // 标记已检查，避免刷新后再次触发
          localStorage.setItem(CHECK_KEY, current);
          // 保存游戏后再刷新
          try {
            const saveKey = 'xiuxian-save';
            const saved = localStorage.getItem(saveKey);
            if (saved) {
              const data = JSON.parse(saved);
              data.timestamp = Date.now();
              localStorage.setItem(saveKey, JSON.stringify(data));
            }
          } catch {}
          window.location.reload();
        } else {
          // 当前已是最新，标记免检
          localStorage.setItem(CHECK_KEY, current);
        }
      })
      .catch(() => {
        // 静默失败
      })
      .finally(() => clearTimeout(timeoutId));

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, []);
}
