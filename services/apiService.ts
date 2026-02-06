
const API_BASE_URL = 'http://localhost:8080/api/v1';

export interface User {
  userId: number;
  username: string;
  nickname: string;
  email: string;
  level: number;
  // ... other fields
}

export interface GameSave {
  id: number;
  slotId: number;
  saveData: string;
  summary: string;
  updateTime: string;
}

interface ApiResponse<T> {
  success: boolean;
  code: string;
  message: string;
  data: T;
}

class ApiService {
  private token: string | null = localStorage.getItem('accessToken');
  private refreshToken: string | null = localStorage.getItem('refreshToken');

  constructor() {
    // initialize
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;

    const headers = {
      'Content-Type': 'application/json',
      ...(this.token ? { 'Authorization': `Bearer ${this.token}` } : {}),
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      // Try refresh
      if (await this.refreshTokens()) {
        return this.request<T>(endpoint, options);
      } else {
        this.logout();
        throw new Error('Unauthorized');
      }
    }

    const json = await response.json();
    if (!json.success) {
      throw new Error(json.message || 'API Error');
    }

    return json.data;
  }

  private async refreshTokens(): Promise<boolean> {
    if (!this.refreshToken) return false;

    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Refresh-Token': this.refreshToken
        }
      });

      const json = await response.json();
      if (json.success && json.data.accessToken) {
        this.setTokens(json.data.accessToken, this.refreshToken); // Refresh token usually rotates too but spec says X-Refresh-Token header for request
        return true;
      }
    } catch (e) {
      console.error('Refresh failed', e);
    }
    return false;
  }

  private setTokens(accessToken: string, refreshToken: string) {
    this.token = accessToken;
    this.refreshToken = refreshToken;
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
  }

  logout() {
    this.token = null;
    this.refreshToken = null;
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  }

  isLoggedIn(): boolean {
    return !!this.token;
  }

  // Auth
  async login(username: string, password: string): Promise<User> {
    const data = await this.request<any>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    this.setTokens(data.accessToken, data.refreshToken);
    localStorage.setItem('user', JSON.stringify(data));
    return data;
  }

  async register(username: string, password: string, email: string, nickname: string): Promise<User> {
    const data = await this.request<any>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, password, confirmPassword: password, email, nickname }),
    });
    this.setTokens(data.accessToken, data.refreshToken);
    localStorage.setItem('user', JSON.stringify(data));
    return data;
  }

  async getMe(): Promise<User> {
    return this.request<User>('/auth/me');
  }

  // Cloud Save
  async getCloudSaves(): Promise<GameSave[]> {
    return this.request<GameSave[]>('/saves');
  }

  async uploadSave(slotId: number, saveData: string, summary: string): Promise<GameSave> {
    return this.request<GameSave>(`/saves/${slotId}`, {
      method: 'POST',
      body: JSON.stringify({ saveData, summary }),
    });
  }

  async deleteCloudSave(slotId: number): Promise<void> {
    return this.request<void>(`/saves/${slotId}`, {
        method: 'DELETE'
    });
  }
}

export const apiService = new ApiService();
