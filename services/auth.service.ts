import { apiClient } from '../lib/api.client';
import { LoginRequest, LoginResponse } from '../types/auth.types';

export const authService = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    return apiClient.post<LoginResponse>('/auth/login', credentials);
  },

  logout: async (): Promise<void> => {
    return apiClient.post<void>('/auth/logout');
  },

  refreshToken: async (refreshToken: string): Promise<LoginResponse> => {
    return apiClient.post<LoginResponse>('/auth/refresh', { refreshToken });
  },
};