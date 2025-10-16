// lib/api.client.ts
import Constants from 'expo-constants';
import { useAuthStore } from '../store/auth.store';
import { ApiError } from '../types/api.types';

type Extra = {
  EXPO_PUBLIC_API_URL?: string;
  apiBaseUrl?: string;
};

const extra = ((Constants as any)?.expoConfig?.extra ??
  (Constants as any)?.manifest?.extra ??
  {}) as Extra;

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ??
  extra.EXPO_PUBLIC_API_URL ??
  extra.apiBaseUrl ??
  'http://localhost:3000/api/v1';

// ────────────────────────────────────────────────────────────────────────────────
// Error de API tipado
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

// ────────────────────────────────────────────────────────────────────────────────
// Cliente HTTP
export class ApiClient {
  constructor(private baseURL: string = API_BASE_URL) {}

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    // 👇 En lugar de importar auth.store al inicio del archivo,
    // usa importación dinámica SOLO cuando necesites el token
    const { useAuthStore } = await import('../store/auth.store');
    const token = useAuthStore.getState().token;

    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers,
    });

    // Si es 401, limpia la sesión
    if (res.status === 401) {
      await useAuthStore.getState().clearAuth();
    }

    // Cuerpo (si existe)
    let data: any = null;
    const text = await res.text();
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = text; // no-JSON
      }
    }

    // 401 → logout
    if (res.status === 401) {
      // ✅ Usar clearAuth del store
      await useAuthStore.getState().clearAuth();
      throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
    }

    // Contrato de error
    if (!res.ok || (data && data.success === false)) {
      const err = (data ?? {}) as ApiError;
      throw new ApiErrorClass(
        err.message || `Error ${res.status}`,
        err.code,
        err.details,
        // mapear snake/camel por compatibilidad
        (err as any).unrecognizedKeys ?? (err as any).unrecognized_keys,
        (err as any).traceId ?? (err as any).trace_id
      );
    }

    // Contrato de éxito: { data } o cuerpo plano
    return (data && data.data !== undefined ? data.data : data) as T;
  }

  get<T>(endpoint: string, params?: Record<string, any>) {
    const qs = params ? `?${new URLSearchParams(params as any).toString()}` : '';
    return this.request<T>(`${endpoint}${qs}`, { method: 'GET' });
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
}

export const apiClient = new ApiClient();
