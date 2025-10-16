// services/auth.service.ts
import { API_CONFIG, AUTH_ENDPOINTS, buildUrl, getAuthHeaders } from '@/lib/api.config';

export type UserRole = 'ADMIN' | 'VENTANA' | 'VENDEDOR';

export interface User {
  id: string;
  email: string;
  username: string;
  name: string;
  role: UserRole;
}

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

export interface ApiError {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
}

class AuthService {
  /**
   * Login de usuario
   */
  async login(username: string, password: string): Promise<LoginResponse> {
    try {
      const response = await fetch(buildUrl(AUTH_ENDPOINTS.LOGIN), {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al iniciar sesión');
      }

      return data;
    } catch (error) {
      console.error('❌ Error en login:', error);
      throw error;
    }
  }

  /**
   * Obtener información del usuario autenticado
   */
  async me(accessToken: string): Promise<MeResponse> {
    try {
      const response = await fetch(buildUrl(AUTH_ENDPOINTS.ME), {
        method: 'GET',
        headers: getAuthHeaders(accessToken),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al obtener información del usuario');
      }

      return data;
    } catch (error) {
      console.error('❌ Error en /auth/me:', error);
      throw error;
    }
  }

  /**
   * Logout de usuario
   */
  async logout(accessToken: string): Promise<void> {
    try {
      await fetch(buildUrl(AUTH_ENDPOINTS.LOGOUT), {
        method: 'POST',
        headers: getAuthHeaders(accessToken),
      });
    } catch (error) {
      console.error('❌ Error en logout:', error);
      // No lanzamos error porque el logout local debe funcionar aunque falle el servidor
    }
  }

  /**
   * Refresh token
   */
  async refresh(refreshToken: string): Promise<LoginResponse> {
    try {
      const response = await fetch(buildUrl(AUTH_ENDPOINTS.REFRESH), {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ refreshToken }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al refrescar token');
      }

      return data;
    } catch (error) {
      console.error('❌ Error en refresh:', error);
      throw error;
    }
  }
}

export const authService = new AuthService();