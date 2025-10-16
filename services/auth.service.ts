// services/auth.service.ts
import { apiClient } from '../lib/api.client';
import { User } from '../types/auth.types';

export interface LoginResponse {
  success: boolean;
  data: {
    accessToken: string;
    refreshToken?: string;
    user?: User;
  };
  message?: string;
}

export interface MeResponse {
  success: boolean;
  data: User;
  message?: string;
}

class AuthService {
  async login(username: string, password: string): Promise<LoginResponse> {
    // POST https://.../api/v1/auth/login
    return apiClient.post<LoginResponse>('/auth/login', { username, password });
  }

  async me(_accessToken: string): Promise<MeResponse> {
    // GET https://.../api/v1/auth/me   (token sale del store en apiClient)
    return apiClient.get<MeResponse>('/auth/me');
  }

  async logout(_accessToken: string): Promise<void> {
    // POST https://.../api/v1/auth/logout
    await apiClient.post<void>('/auth/logout');
  }

  async refresh(refreshToken: string): Promise<LoginResponse> {
    // POST https://.../api/v1/auth/refresh
    return apiClient.post<LoginResponse>('/auth/refresh', { refreshToken });
  }
}

export const authService = new AuthService();
