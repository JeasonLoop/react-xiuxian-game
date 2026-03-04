import { useAuthStore } from '../store/authStore';
import { API_URL } from '../constants/api';
import { showError } from '../utils/toastUtils';

const LOGIN_EXPIRED_MSG = '登录已过期，请重新登录';

async function refreshAccessToken(): Promise<string> {
  const { refreshToken, setTokens, logout } = useAuthStore.getState();
  if (!refreshToken) {
    logout();
    showError(LOGIN_EXPIRED_MSG);
    throw new Error(LOGIN_EXPIRED_MSG);
  }

  const response = await fetch(`${API_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    useAuthStore.getState().logout();
    showError(data.error || LOGIN_EXPIRED_MSG);
    throw new Error(LOGIN_EXPIRED_MSG);
  }

  setTokens(data.token, data.refreshToken);
  return data.token;
}

/**
 * 带 token 的请求：若返回 401 则尝试刷新 token 并重试一次，失败则登出并提示
 */
async function fetchWithAuth(
  url: string,
  options: RequestInit & { _retry?: boolean } = {}
): Promise<Response> {
  const { token } = useAuthStore.getState();
  if (!token) throw new Error('Not authenticated');

  const { _retry, ...fetchOptions } = options;
  const res = await fetch(url, {
    ...fetchOptions,
    headers: {
      ...(fetchOptions.headers as Record<string, string>),
      Authorization: `Bearer ${token}`,
    },
  });

  if (res.status === 401 && !_retry) {
    await refreshAccessToken();
    return fetchWithAuth(url, { ...options, _retry: true });
  }

  if (res.status === 401 || res.status === 403) {
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
