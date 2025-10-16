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

// ── Normalizadores ─────────────────────────────────────────────────────────────
function normalizeLoginPayload(raw: any): LoginResponse {
  // tu apiClient ya retorna body o body.data directo; aquí lo envolvemos
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
    // mensaje que tu store espera para marcar error
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

// ── Servicio ───────────────────────────────────────────────────────────────────
class AuthService {
  async login(username: string, password: string): Promise<LoginResponse> {
    // apiClient.post devuelve body o body.data (NO el AxiosResponse)
    const body = await apiClient.post<any>('/auth/login', { username, password });
    return normalizeLoginPayload(body);
  }

  // sin parámetros: apiClient añade Authorization desde el store
  async me(): Promise<MeResponse> {
    const body = await apiClient.get<any>('/auth/me');
    return normalizeMePayload(body);
  }

  async logout(): Promise<void> {
    await apiClient.post<void>('/auth/logout');
  }

  async refresh(refreshToken: string): Promise<LoginResponse> {
    const body = await apiClient.post<any>('/auth/refresh', { refreshToken });
    return normalizeLoginPayload(body);
  }
}

export const authService = new AuthService();
