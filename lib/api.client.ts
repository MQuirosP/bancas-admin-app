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
// Cliente HTTP con refresh token CORREGIDO
export class ApiClient {
  private isRefreshing = false;
  private refreshSubscribers: Array<(token: string) => void> = [];

  constructor(private baseURL: string = API_BASE_URL) {}

  private subscribeTokenRefresh(callback: (token: string) => void) {
    this.refreshSubscribers.push(callback);
  }

  private onTokenRefreshed(token: string) {
    this.refreshSubscribers.forEach((callback) => callback(token));
    this.refreshSubscribers = [];
  }

  private async refreshAccessToken(): Promise<string> {
    const { refreshToken } = useAuthStore.getState();
    
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

      // Actualizar el token en el store
      useAuthStore.setState({ token: newAccessToken });

      return newAccessToken;
    } catch (error) {
      console.error('❌ Error en refresh token:', error);
      // Si falla el refresh, cerrar sesión
      await useAuthStore.getState().clearAuth();
      throw error;
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = useAuthStore.getState().token;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> | undefined),
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const url = `${this.baseURL}${endpoint}`;
    
    // CRÍTICO: NO hacer refresh en endpoints de auth
    const isAuthEndpoint = endpoint.includes('/auth/login') || 
                          endpoint.includes('/auth/refresh') || 
                          endpoint.includes('/auth/register');
    
    let res = await fetch(url, { ...options, headers });

    // Si es 401 Y NO es un endpoint de auth, intentar refresh
    if (res.status === 401 && !isAuthEndpoint) {
      console.log('🔄 Token expirado, intentando refresh...');
      
      if (!this.isRefreshing) {
        this.isRefreshing = true;
        
        try {
          const newToken = await this.refreshAccessToken();
          this.isRefreshing = false;
          this.onTokenRefreshed(newToken);

          console.log('✅ Token refrescado exitosamente');
          
          // Reintentar la petición original con el nuevo token
          headers['Authorization'] = `Bearer ${newToken}`;
          res = await fetch(url, { ...options, headers });
        } catch (error) {
          this.isRefreshing = false;
          console.error('❌ Refresh token falló, cerrando sesión');
          throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
        }
      } else {
        // Si ya se está refrescando, esperar a que termine
        console.log('⏳ Esperando refresh en progreso...');
        const newToken = await new Promise<string>((resolve, reject) => {
          this.subscribeTokenRefresh(resolve);
          // Timeout de 10 segundos
          setTimeout(() => reject(new Error('Refresh timeout')), 10000);
        });

        // Reintentar con el nuevo token
        headers['Authorization'] = `Bearer ${newToken}`;
        res = await fetch(url, { ...options, headers });
      }
    }

    // Cuerpo (si existe)
    let data: any = null;
    const text = await res.text();
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }
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