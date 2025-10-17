// lib/api.client.ts
import Constants from 'expo-constants';
import { useAuthStore } from '../store/auth.store';
import { ApiError } from '../types/api.types';

type Extra = {
  EXPO_PUBLIC_API_BASE_URL?: string;
  apiBaseUrl?: string;
};

const extra =
  ((Constants as any)?.expoConfig?.extra ??
    (Constants as any)?.manifest?.extra ??
    {}) as Extra;

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ??
  extra.EXPO_PUBLIC_API_BASE_URL ??
  extra.apiBaseUrl ??
  'https://backend-bancas.onrender.com/api/v1';

function buildQuery(params?: Record<string, any>) {
  if (!params) return '';
  const qp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null) continue;
    if (typeof v === 'string' && v.trim() === '') continue; // <- omite strings vacíos
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

// ────────────────────────────────────────────────────────────────────────────────
// ✅ Error de API tipado Y EXPORTADO
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

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = useAuthStore.getState().token;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> | undefined),
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const url = `${this.baseURL}${endpoint}`;
    const res = await fetch(url, { ...options, headers });

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
        (err as any).unrecognizedKeys ?? (err as any).unrecognized_keys,
        (err as any).traceId ?? (err as any).trace_id
      );
    }

    // Contrato de éxito: { data } o cuerpo plano
    return (data && data.data !== undefined ? data.data : data) as T;
  }

  // ✅ Método GET con params como segundo argumento (Record<string, any>)
  get<T>(endpoint: string, params?: Record<string, any>) {
    const qs = buildQuery(params);
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