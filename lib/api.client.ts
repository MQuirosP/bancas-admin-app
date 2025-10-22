// lib/api.client.ts
import Constants from 'expo-constants';
import { getAccessToken, getRefreshToken, setAccessToken, clearTokens } from './auth.token';
import { ApiError } from '../types/api.types';

type Extra = {
  EXPO_PUBLIC_API_BASE_URL?: string;
  apiBaseUrl?: string;
};

const extra = ((Constants as any)?.expoConfig?.extra ??
  (Constants as any)?.manifest?.extra ??
  {}) as Extra;

// const API_BASE_URL =
//   process.env.EXPO_PUBLIC_API_BASE_URL ??
//   extra.EXPO_PUBLIC_API_BASE_URL ??
//   extra.apiBaseUrl ??
//   'https://backend-bancas.onrender.com/api/v1';
const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ??
  extra.EXPO_PUBLIC_API_BASE_URL ??
  extra.apiBaseUrl ??
  'http://localhost:3000/api/v1';

export const buildQueryString = buildQuery; // alias público

function buildQuery(params?: Record<string, any>) {
  if (!params) return '';
  const qp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null) continue;
    if (typeof v === 'string' && v.trim() === '') continue;
    if (Array.isArray(v)) {
      v.forEach((item) => {
        if (item === undefined || item === null) return;
        const s = String(item).trim();
        if (s === '') return;
        qp.append(k, s);
      });
    } else {
      qp.set(k, String(v));
    }
  }
  const qs = qp.toString();
  return qs ? `?${qs}` : '';
}

export class ApiErrorClass extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: Array<{ field?: string; message: string }>,
    public unrecognizedKeys?: string[],
    public traceId?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class ApiClient {
  private isRefreshing = false;
  private refreshSubscribers: Array<(token: string) => void> = [];

  constructor(private baseURL: string = API_BASE_URL) {}

  public buildQueryString(params?: Record<string, any>) {
    return buildQuery(params);
  }

  private async requestWithBody<T>(
    endpoint: string,
    method: 'DELETE' | 'POST' | 'PUT' | 'PATCH',
    body?: any
  ): Promise<T> {
    return this.request<T>(endpoint, {
      method,
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  private subscribeTokenRefresh(callback: (token: string) => void) {
    this.refreshSubscribers.push(callback);
  }

  private onTokenRefreshed(token: string) {
    this.refreshSubscribers.forEach((callback) => callback(token));
    this.refreshSubscribers = [];
  }

  private async refreshAccessToken(): Promise<string> {
    const refreshToken = await getRefreshToken();

    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await fetch(`${this.baseURL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        throw new Error('Failed to refresh token');
      }

      const data = await response.json();
      const newAccessToken = data.data?.accessToken || data.accessToken;

      if (!newAccessToken) {
        throw new Error('No access token in refresh response');
      }

      // ✅ SOLO guardar en auth.token.ts, NO tocar el store
      await setAccessToken(newAccessToken);

      return newAccessToken;
    } catch (error) {
      console.error('❌ Error en refresh token:', error);
      await clearTokens();
      throw error;
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = await getAccessToken();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> | undefined),
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const url = `${this.baseURL}${endpoint}`;

    const isAuthEndpoint =
      endpoint.includes('/auth/login') ||
      endpoint.includes('/auth/refresh') ||
      endpoint.includes('/auth/register');

    let res = await fetch(url, { ...options, headers });

    if (res.status === 401 && !isAuthEndpoint) {
      console.log('🔄 Token expirado, intentando refresh...');

      if (!this.isRefreshing) {
        this.isRefreshing = true;

        try {
          const newToken = await this.refreshAccessToken();
          this.isRefreshing = false;
          this.onTokenRefreshed(newToken);

          console.log('✅ Token refrescado exitosamente');

          headers['Authorization'] = `Bearer ${newToken}`;
          res = await fetch(url, { ...options, headers });
        } catch (error) {
          this.isRefreshing = false;
          console.error('❌ Refresh token falló, cerrando sesión');
          throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
        }
      } else {
        console.log('⏳ Esperando refresh en progreso...');
        const newToken = await new Promise<string>((resolve, reject) => {
          this.subscribeTokenRefresh(resolve);
          setTimeout(() => reject(new Error('Refresh timeout')), 10000);
        });

        headers['Authorization'] = `Bearer ${newToken}`;
        res = await fetch(url, { ...options, headers });
      }
    }

    let data: any = null;
    const text = await res.text();
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }
    }

    if (!res.ok || (data && data.success === false)) {
      const err = (data ?? {}) as ApiError;
      throw new ApiErrorClass(
        err.message || `Error ${res.status}`,
        err.code,
        err.details,
        (err as any).unrecognizedKeys ?? (err as any).unrecognized_keys,
        (err as any).traceId ?? (err as any).trace_id
      );
    }

    // ✅ Si la API devuelve { success, data, meta }, no destripamos: devolvemos el objeto completo
    if (data && typeof data === 'object') {
      if ('data' in data && 'meta' in data) {
        return data as T;
      }
      // Si devuelve { success, data } sin meta, devolvemos data “plano” como antes
      if ('data' in data) {
        return (data as any).data as T;
      }
    }

    return data as T;
  }

  get<T>(endpoint: string, params?: Record<string, any>) {
    const qs = buildQuery(params);
    return this.request<T>(`${endpoint}${qs}`, {
      method: 'GET',
      // 👇 evita 304 y cuerpos vacíos en web
      cache: 'no-store' as RequestCache,
    });
  }

  post<T>(endpoint: string, body?: any) {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  patch<T>(endpoint: string, body?: any) {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  put<T>(endpoint: string, body?: any) {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  delete<T>(endpoint: string) {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  deleteWithBody<T>(endpoint: string, body?: any) {
    return this.requestWithBody<T>(endpoint, 'DELETE', body);
  }
}

export const apiClient = new ApiClient();
