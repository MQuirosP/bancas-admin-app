// services/auth.service.ts
import { buildUrl, getAuthHeaders } from '../lib/api.config';

// ✅ Importar tipos desde auth.types.ts (eliminar duplicados)
import { User } from '../types/auth.types';

// ✅ Interfaces de respuesta del backend
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
      const response = await fetch(buildUrl('/auth/login'), {
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
      const response = await fetch(buildUrl('/auth/me'), {
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
   * ✅ Ahora recibe accessToken como parámetro
   */
  async logout(accessToken: string): Promise<void> {
    try {
      await fetch(buildUrl('/auth/logout'), {
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
      const response = await fetch(buildUrl('/auth/refresh'), {
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