// services/auth.service.ts
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  User,
} from '@/types/auth.types';
import { apiClient } from '../lib/api.client';

export const authService = {
  /**
   * Login con username y password
   */
  async login(username: string, password: string): Promise<LoginResponse> {
    return await apiClient.post<LoginResponse>('/auth/login', {
      username,
      password,
    });
  },

  /**
   * Logout
   */
  async logout(): Promise<void> {
    await apiClient.post('/auth/logout');
  },

  /**
   * Obtener usuario actual
   */
  async getCurrentUser(): Promise<User> {
    return await apiClient.get<User>('/auth/me');
  },

  /**
   * Registro de nuevo usuario (solo ADMIN puede hacer esto)
   */
  async register(data: RegisterRequest): Promise<User> {
    return await apiClient.post<User>('/auth/register', data);
  },

  /**
   * Cambiar contraseña
   */
  async changePassword(
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    await apiClient.post('/auth/change-password', {
      currentPassword,
      newPassword,
    });
  },

  /**
   * Refresh token
   */
  async refreshToken(refreshToken: string): Promise<LoginResponse> {
    return await apiClient.post<LoginResponse>('/auth/refresh', {
      refreshToken,
    });
  },

  /**
   * Verificar si el username ya existe
   */
  async checkUsernameAvailability(username: string): Promise<boolean> {
    const result = await apiClient.get<{ available: boolean }>(
      `/auth/check-username/${username}`
    );
    return result.available;
  },
};