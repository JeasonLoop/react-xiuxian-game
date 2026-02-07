
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
  async getCloudSave(): Promise<GameSave | null> {
    try {
        const result = await this.request<GameSave>('/saves');
        return result || null;
    } catch (e) {
        // 如果是 404 或 data 为 null，可能抛出异常，这里我们捕获并返回 null 表示没存档
        console.warn('Get cloud save failed or empty', e);
        return null;
    }
  }

  async uploadSave(saveData: string, summary: string): Promise<GameSave> {
    return this.request<GameSave>('/saves', {
      method: 'POST',
      body: JSON.stringify({ saveData, summary }),
    });
  }

  async deleteCloudSave(): Promise<void> {
    return this.request<void>('/saves', {
        method: 'DELETE'
    });
  }

  async exportSaveFile(): Promise<Blob> {
    const url = `${API_BASE_URL}/saves/export`;
    const headers = this.token ? { 'Authorization': `Bearer ${this.token}` } : {};

    const response = await fetch(url, { headers });
    if (response.status === 401) {
        if (await this.refreshTokens()) {
            return this.exportSaveFile();
        } else {
            throw new Error('Unauthorized');
        }
    }

    if (!response.ok) {
        throw new Error('Export failed');
    }

    return response.blob();
  }

  async importSaveFile(file: File): Promise<GameSave> {
    const url = `${API_BASE_URL}/saves/import`;
    const formData = new FormData();
    formData.append('file', file);

    const headers: any = {};
    if (this.token) {
        headers['Authorization'] = `Bearer ${this.token}`;
    }
    // Do NOT set Content-Type header for FormData, browser does it automatically with boundary

    const response = await fetch(url, {
        method: 'POST',
        headers,
        body: formData
    });

    if (response.status === 401) {
        if (await this.refreshTokens()) {
            return this.importSaveFile(file);
        } else {
             throw new Error('Unauthorized');
        }
    }

    const json = await response.json();
    if (!json.success) {
        throw new Error(json.message || 'Import failed');
    }

    return json.data;
  }
}

export const apiService = new ApiService();
