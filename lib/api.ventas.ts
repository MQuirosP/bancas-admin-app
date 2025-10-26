// lib/api.ventas.ts
import { apiClient } from '@/lib/api.client'
import { compact } from '@/utils/object'

export type VentasListQuery = {
  page?: number
  pageSize?: number
  scope?: 'mine' | 'all'
  date?: 'today' | 'yesterday' | 'range'
  from?: string
  to?: string
  status?: string
  winnersOnly?: boolean
  bancaId?: string
  ventanaId?: string
  vendedorId?: string
  loteriaId?: string
  sorteoId?: string
  search?: string
  orderBy?: string
}

export type VentasSummary = {
  ventasTotal: number
  ticketsCount: number
  jugadasCount: number
  payoutTotal: number
  neto: number
  lastTicketAt?: string | null
}

export type BreakdownItem = {
  key: string
  name?: string
  ventasTotal: number
  ticketsCount: number
  payoutTotal?: number
  neto?: number
}

export type TimeseriesPoint = {
  ts: string
  ventasTotal: number
  ticketsCount: number
}

export type VentasListResponse<T> = { success?: boolean; data: T[]; meta: any }

export const VentasApi = {
  list: (q: VentasListQuery = {}) => apiClient.get<VentasListResponse<any>>('/ventas', compact(q)),
  summary: (q: Omit<VentasListQuery, 'page' | 'pageSize'> = {}) =>
    apiClient.get<{ success?: boolean; data: VentasSummary }>('/ventas/summary', compact(q)),
  breakdown: (
    q: Omit<VentasListQuery, 'page' | 'pageSize'> & { dimension: 'ventana' | 'vendedor' | 'loteria' | 'sorteo' | 'numero'; top?: number }
  ) => {
    const top = typeof q.top === 'number' ? Math.min(Math.max(1, Math.floor(q.top)), 50) : undefined
    const payload = { ...q, ...(top ? { top } : {}) }
    return apiClient.get<{ success?: boolean; data: BreakdownItem[] }>('/ventas/breakdown', compact(payload))
  },
  timeseries: (
    q: Omit<VentasListQuery, 'page' | 'pageSize'> & { granularity?: 'hour' | 'day' | 'week'; dimension?: string }
  ) => apiClient.get<{ success?: boolean; data: TimeseriesPoint[] }>('/ventas/timeseries', compact(q)),
}
