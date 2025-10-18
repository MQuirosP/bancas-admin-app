// services/auth.service.ts
import { apiClient } from '../lib/api.client';
import { setTokens, setAccessToken, clearTokens } from '../lib/auth.token';
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

function normalizeLoginPayload(raw: any): LoginResponse {
  const payload = raw;

  const accessToken =
    payload?.accessToken ??
    payload?.token ??
    payload?.jwt ??
    payload?.access_token ??
    payload?.data?.accessToken ??
    null;

  const refreshToken =
    payload?.refreshToken ??
    payload?.refresh_token ??
    payload?.data?.refreshToken ??
    undefined;

  const user: User | undefined =
    payload?.user ??
    payload?.data?.user ??
    undefined;

  if (!accessToken) {
    throw new Error('Respuesta de login inválida');
  }

  return {
    success: true,
    data: { accessToken, refreshToken, user },
    message: payload?.message,
  };
}

function normalizeMePayload(raw: any): MeResponse {
  const payload = raw;
  const user: User | undefined =
    payload?.data ??
    payload?.user ??
    (payload && typeof payload === 'object' ? (payload as User) : undefined);

  if (!user) {
    throw new Error('Error al obtener información del usuario');
  }

  return { success: true, data: user, message: payload?.message };
}

class AuthService {
  async login(username: string, password: string): Promise<LoginResponse> {
    const body = await apiClient.post<any>('/auth/login', { username, password });
    const normalized = normalizeLoginPayload(body);
    
    // ✅ GUARDAR tokens en auth.token.ts
    await setTokens(
      normalized.data.accessToken,
      normalized.data.refreshToken || ''
    );
    
    return normalized;
  }

  async me(): Promise<MeResponse> {
    const body = await apiClient.get<any>('/auth/me');
    return normalizeMePayload(body);
  }

  async logout(): Promise<void> {
    await apiClient.post<void>('/auth/logout');
    // ✅ LIMPIAR tokens
    await clearTokens();
  }

  async refresh(refreshToken: string): Promise<LoginResponse> {
    const body = await apiClient.post<any>('/auth/refresh', { refreshToken });
    const normalized = normalizeLoginPayload(body);
    
    // ✅ ACTUALIZAR access token
    await setAccessToken(normalized.data.accessToken);
    
    return normalized;
  }
}

export const authService = new AuthService();