import { useAuthStore } from '../store/authStore';
import { API_URL } from '../constants/api';
import { showError } from '../utils/toastUtils';

const LOGIN_EXPIRED_MSG = '登录已过期，请重新登录';

/** 防止并发刷新：同一时间只允许一个 refresh 请求 */
let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  // 如果已有刷新在进行中，复用同一个 Promise
  if (refreshPromise) return refreshPromise;

  // 快照当前 token，用于后续比较（检测是否有新登录插入）
  const snap = useAuthStore.getState();
  const capturedRefreshToken = snap.refreshToken;

  refreshPromise = (async () => {
    try {
      if (!capturedRefreshToken) {
        useAuthStore.getState().logout();
        showError(LOGIN_EXPIRED_MSG);
        throw new Error(LOGIN_EXPIRED_MSG);
      }

      const response = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: capturedRefreshToken }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        // 检查是否 tokens 已被新登录替换
        const cur = useAuthStore.getState();
        if (cur.refreshToken !== capturedRefreshToken) {
          // 新登录已写入新 token，静默放弃
          return '';
        }
        useAuthStore.getState().logout();
        showError(data.error || LOGIN_EXPIRED_MSG);
        throw new Error(LOGIN_EXPIRED_MSG);
      }

      // 成功：写入新 token
      useAuthStore.getState().setTokens(data.token, data.refreshToken);
      return data.token;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

/**
 * 带 token 的请求：若返回 401 则尝试刷新 token 并重试一次，失败则登出并提示
 */
async function fetchWithAuth(
  url: string,
  options: RequestInit & { _retry?: boolean } = {}
): Promise<Response> {
  const state = useAuthStore.getState();
  const capturedToken = state.token;
  if (!capturedToken) throw new Error('Not authenticated');

  const { _retry, ...fetchOptions } = options;
  const res = await fetch(url, {
    ...fetchOptions,
    headers: {
      ...(fetchOptions.headers as Record<string, string>),
      Authorization: `Bearer ${capturedToken}`,
    },
  });

  if (res.status === 401 && !_retry) {
    await refreshAccessToken();
    return fetchWithAuth(url, { ...options, _retry: true });
  }

  if (res.status === 401 || res.status === 403) {
    // 检查 token 是否已被新登录替换
    const cur = useAuthStore.getState();
    if (cur.token !== capturedToken) {
      throw new Error('Token changed, request aborted');
    }
    useAuthStore.getState().logout();
    showError(LOGIN_EXPIRED_MSG);
    throw new Error(LOGIN_EXPIRED_MSG);
  }

  return res;
}

export const cloudSaveService = {
  async fetchSave() {
    const response = await fetchWithAuth(`${API_URL}/save`);

    if (response.status === 404) return null;
    if (!response.ok) {
      throw new Error('拉取云端存档失败，请检查网络或稍后重试');
    }

    return await response.json();
  },

  async pushSave(saveData: unknown) {
    const response = await fetchWithAuth(`${API_URL}/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(saveData),
    });

    if (!response.ok) {
      throw new Error('云端存档保存失败，请检查网络或稍后重试');
    }

    return await response.json();
  },
};
