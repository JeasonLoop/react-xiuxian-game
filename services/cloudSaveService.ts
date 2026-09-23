import { useAuthStore } from '../store/authStore';
import { API_URL } from '../constants/api';
import { showError } from '../utils/toastUtils';

const LOGIN_EXPIRED_MSG = '登录已过期，请重新登录';
const STALE_REQUEST_MSG = 'Session changed, request aborted';

let refreshPromise: Promise<string> | null = null;
let refreshSessionId = -1;

function assertSession(sessionId: number) {
  if (useAuthStore.getState().sessionId !== sessionId) {
    throw new Error(STALE_REQUEST_MSG);
  }
}

async function refreshAccessToken(sessionId: number): Promise<string> {
  assertSession(sessionId);
  if (refreshPromise && refreshSessionId === sessionId) return refreshPromise;

  const capturedRefreshToken = useAuthStore.getState().refreshToken;
  refreshSessionId = sessionId;
  // 用 microtask 启动，确保即使无 refresh token 也能可靠清理共享 Promise。
  const pending = Promise.resolve().then(async () => {
    if (!capturedRefreshToken) {
      assertSession(sessionId);
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
    assertSession(sessionId);

    if (!response.ok) {
      useAuthStore.getState().logout();
      showError(data.error || LOGIN_EXPIRED_MSG);
      throw new Error(LOGIN_EXPIRED_MSG);
    }

    useAuthStore.getState().setTokens(data.token, data.refreshToken);
    return data.token as string;
  });
  const tracked = pending.finally(() => {
    if (refreshPromise === tracked) refreshPromise = null;
  });
  refreshPromise = tracked;
  return tracked;
}

/** 401 时刷新并重试一次；过期时仅当前登录会话可登出。 */
async function fetchWithAuth(
  url: string,
  options: RequestInit & { _retry?: boolean } = {},
  sessionId = useAuthStore.getState().sessionId
): Promise<Response> {
  assertSession(sessionId);
  const capturedToken = useAuthStore.getState().token;
  if (!capturedToken) throw new Error('Not authenticated');

  const { _retry, ...fetchOptions } = options;
  const res = await fetch(url, {
    ...fetchOptions,
    headers: {
      ...(fetchOptions.headers as Record<string, string>),
      Authorization: `Bearer ${capturedToken}`,
    },
  });
  assertSession(sessionId);

  if (res.status === 401 && !_retry) {
    // 另一请求可能已刷新当前会话的 token，直接用新 token 重试。
    if (useAuthStore.getState().token === capturedToken) {
      await refreshAccessToken(sessionId);
    }
    assertSession(sessionId);
    return fetchWithAuth(url, { ...options, _retry: true }, sessionId);
  }

  if (res.status === 401 || res.status === 403) {
    // 旧 token 的迟到响应不能让已成功刷新的当前会话登出。
    if (useAuthStore.getState().token !== capturedToken) {
      throw new Error(STALE_REQUEST_MSG);
    }
    useAuthStore.getState().logout();
    showError(LOGIN_EXPIRED_MSG);
    throw new Error(LOGIN_EXPIRED_MSG);
  }

  return res;
}

export const cloudSaveService = {
  async fetchSave() {
    const sessionId = useAuthStore.getState().sessionId;
    const response = await fetchWithAuth(`${API_URL}/save`, {}, sessionId);
    if (response.status === 404) return null;
    if (!response.ok) throw new Error('拉取云端存档失败，请检查网络或稍后重试');
    const save = await response.json();
    assertSession(sessionId);
    return save;
  },
  async pushSave(saveData: unknown) {
    const sessionId = useAuthStore.getState().sessionId;
    const response = await fetchWithAuth(`${API_URL}/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(saveData),
    }, sessionId);
    if (!response.ok) throw new Error('云端存档保存失败，请检查网络或稍后重试');
    const result = await response.json();
    assertSession(sessionId);
    return result;
  },
};
