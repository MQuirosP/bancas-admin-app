// lib/api.client.ts
import Constants from 'expo-constants'
import { getAccessToken, getRefreshToken, setAccessToken, clearTokens } from './auth.token'
import { ApiError } from '../types/api.types'
import { AuthenticationError, ErrorCode } from './errors'
import { API_BASE_URL } from './config'

// Handler global para expiración de sesión (lo registra un layout protegido)
let onAuthExpired: ((msg: string) => void) | null = null
export const setAuthExpiredHandler = (fn: (msg: string) => void) => {
  onAuthExpired = fn
}

// API base URL centralizado en lib/config.ts

export const buildQueryString = buildQuery // alias público

function buildQuery(params?: Record<string, any>) {
  if (!params) return ''
  const qp = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null) continue
    if (typeof v === 'string' && v.trim() === '') continue
    if (Array.isArray(v)) {
      v.forEach((item) => {
        if (item === undefined || item === null) return
        const s = String(item).trim()
        if (s === '') return
        qp.append(k, s)
      })
    } else {
      qp.set(k, String(v))
    }
  }
  const qs = qp.toString()
  return qs ? `?${qs}` : ''
}

export class ApiErrorClass extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: Array<{ field?: string; message: string }>,
    public unrecognizedKeys?: string[],
    public traceId?: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export class ApiClient {
  private isRefreshing = false
  private refreshSubscribers: Array<(token: string) => void> = []

  constructor(private baseURL: string = API_BASE_URL) {}

  public buildQueryString(params?: Record<string, any>) {
    return buildQuery(params)
  }

  private async requestWithBody<T>(
    endpoint: string,
    method: 'DELETE' | 'POST' | 'PUT' | 'PATCH',
    body?: any
  ): Promise<T> {
    return this.request<T>(endpoint, {
      method,
      body: body ? JSON.stringify(body) : undefined,
    })
  }

  private subscribeTokenRefresh(callback: (token: string) => void) {
    this.refreshSubscribers.push(callback)
  }

  private onTokenRefreshed(token: string) {
    this.refreshSubscribers.forEach((callback) => callback(token))
    this.refreshSubscribers = []
  }

    private async refreshAccessToken(): Promise<string> {
    const refreshToken = await getRefreshToken()
    if (!refreshToken) {
      throw new AuthenticationError(
        'Sesión expirada. Por favor, inicia sesión nuevamente.',
        ErrorCode.TOKEN_EXPIRED
      )
    }

    try {
      const response = await fetch(`${this.baseURL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      })

      if (!response.ok) {
        throw new AuthenticationError(
          'Sesión expirada. Por favor, inicia sesión nuevamente.',
          ErrorCode.TOKEN_EXPIRED
        )
      }

      const data = await response.json()
      const newAccessToken = data?.data?.accessToken ?? data?.accessToken
      if (!newAccessToken) {
        throw new AuthenticationError(
          'Sesión expirada. Por favor, inicia sesión nuevamente.',
          ErrorCode.TOKEN_EXPIRED
        )
      }

      await setAccessToken(newAccessToken)

      // ✅ LOG DE ÉXITO DE REFRESH
      console.log('✅ Access token refreshed:', {
        at: new Date().toISOString(),
        baseURL: this.baseURL,
      })

      return newAccessToken
    } catch (error) {
      console.error('❌ Error en refresh token:', error)
      await clearTokens()
      throw new AuthenticationError(
        'Sesión expirada. Por favor, inicia sesión nuevamente.',
        ErrorCode.TOKEN_EXPIRED
      )
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = await getAccessToken()

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> | undefined),
    }
    if (token) headers['Authorization'] = `Bearer ${token}`

    const url = `${this.baseURL}${endpoint}`

    const isAuthEndpoint =
      endpoint.includes('/auth/login') ||
      endpoint.includes('/auth/refresh') ||
      endpoint.includes('/auth/register')

    const doFetch = async (): Promise<Response> => {
      let attempt = 0
      const max = 2
      let resp = await fetch(url, { ...options, headers })
      // Manejo simple de 429 con pequeño backoff respetando Retry-After
      while (resp.status === 429 && attempt < max) {
        attempt++
        const ra = resp.headers.get('retry-after')
        const delayMs = ra ? Math.min(5000, Math.max(500, Number(ra) * 1000 || 1000)) : 1000 * attempt
        await new Promise((r) => setTimeout(r, delayMs))
        resp = await fetch(url, { ...options, headers })
      }
      return resp
    }

    let res = await doFetch()

    // Reintento si 401 y no es endpoint de auth
    if (res.status === 401 && !isAuthEndpoint) {
      console.log('🔄 Token expirado, intentando refresh...')

      if (!this.isRefreshing) {
        this.isRefreshing = true
        try {
          const newToken = await this.refreshAccessToken()
          this.isRefreshing = false
          this.onTokenRefreshed(newToken)

          headers['Authorization'] = `Bearer ${newToken}`
          res = await doFetch()
        } catch (error) {
          this.isRefreshing = false
          console.error('❌ Refresh token falló, cerrando sesión')
          // Notifica al app y lanza error tipado
          onAuthExpired?.('Sesión expirada. Por favor, inicia sesión nuevamente.')
          throw new AuthenticationError(
            'Sesión expirada. Por favor, inicia sesión nuevamente.',
            ErrorCode.TOKEN_EXPIRED
          )
        }
      } else {
        console.log('⏳ Esperando refresh en progreso...')
        const newToken = await new Promise<string>((resolve, reject) => {
          this.subscribeTokenRefresh(resolve)
          setTimeout(() => reject(new Error('Refresh timeout')), 10000)
        })
        headers['Authorization'] = `Bearer ${newToken}`
        res = await doFetch()
    }
    }

    let data: any = null
    const text = await res.text()
    if (text) {
      try {
        data = JSON.parse(text)
      } catch {
        data = text
      }
    }

    if (!res.ok || (data && data.success === false)) {
      const err = (data ?? {}) as ApiError
      throw new ApiErrorClass(
        err.message || `Error ${res.status}`,
        err.code,
        err.details,
        (err as any).unrecognizedKeys ?? (err as any).unrecognized_keys,
        (err as any).traceId ?? (err as any).trace_id
      )
    }

    // Mantén {data,meta} si viene así
    if (data && typeof data === 'object') {
      if ('data' in data && 'meta' in data) return data as T
      if ('data' in data) return (data as any).data as T
    }

    return data as T
  }

  get<T>(endpoint: string, params?: Record<string, any>) {
    const qs = buildQuery(params)
    return this.request<T>(`${endpoint}${qs}`, {
      method: 'GET',
      cache: 'no-store' as RequestCache, // evita 304 en web
    })
  }

  post<T>(endpoint: string, body?: any) {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    })
  }

  patch<T>(endpoint: string, body?: any) {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    })
  }

  put<T>(endpoint: string, body?: any) {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    })
  }

  delete<T>(endpoint: string) {
    return this.request<T>(endpoint, { method: 'DELETE' })
  }

  deleteWithBody<T>(endpoint: string, body?: any) {
    return this.requestWithBody<T>(endpoint, 'DELETE', body)
  }
}

export const apiClient = new ApiClient()
