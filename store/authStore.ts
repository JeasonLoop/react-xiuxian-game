import { create } from 'zustand';

interface User {
  id: number;
  username: string;
}

const AUTH_TOKEN_KEY = 'auth_token';
const AUTH_REFRESH_TOKEN_KEY = 'auth_refresh_token';
const AUTH_USER_KEY = 'auth_user';

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  user: User | null;
  isAuthenticated: boolean;
  /** 登录并拉取云存档后为 true，用于跳过欢迎页直接进游戏 */
  skipWelcomeAfterLogin: boolean;
  login: (token: string, refreshToken: string, user: User) => void;
  setTokens: (token: string, refreshToken: string) => void;
  setSkipWelcomeAfterLogin: (v: boolean) => void;
  logout: () => void;
}

function getStoredUser(): User | null {
  try {
    const raw = localStorage.getItem(AUTH_USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem(AUTH_TOKEN_KEY),
  refreshToken: localStorage.getItem(AUTH_REFRESH_TOKEN_KEY),
  user: getStoredUser(),
  isAuthenticated: !!localStorage.getItem(AUTH_TOKEN_KEY),
  skipWelcomeAfterLogin: false,

  login: (token: string, refreshToken: string, user: User) => {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
    localStorage.setItem(AUTH_REFRESH_TOKEN_KEY, refreshToken);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
    set({ token, refreshToken, user, isAuthenticated: true });
  },

  setTokens: (token: string, refreshToken: string) => {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
    localStorage.setItem(AUTH_REFRESH_TOKEN_KEY, refreshToken);
    set({ token, refreshToken });
  },

  setSkipWelcomeAfterLogin: (v: boolean) => set({ skipWelcomeAfterLogin: v }),

  logout: () => {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_REFRESH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
    set({ token: null, refreshToken: null, user: null, isAuthenticated: false, skipWelcomeAfterLogin: false });
  },
}));
