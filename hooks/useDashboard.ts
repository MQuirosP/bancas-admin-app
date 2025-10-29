/**
 * Hooks para Dashboard Admin v1
 * Con soporte para ETags y cache inteligente
 */

import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { apiClient } from '@/lib/api.client'
import type {
  DashboardFilters,
  DashboardResponse,
  TimeSeriesResponse,
  ExposureResponse,
  CxCResponse,
  CxPResponse,
  GananciaResponse,
  VendedoresResponse,
  ExportResponse,
  GananciaDimension,
  ExportFormat,
} from '@/types/dashboard.types'

// ============================================================
// CACHE DE ETAGS
// ============================================================
const etagCache = new Map<string, string>()

/**
 * Helper para construir query params desde filtros
 */
function buildQueryParams(filters: DashboardFilters): Record<string, any> {
  const params: Record<string, any> = {}
  
  if (filters.date) params.date = filters.date
  if (filters.fromDate) params.fromDate = filters.fromDate
  if (filters.toDate) params.toDate = filters.toDate
  if (filters.ventanaId) params.ventanaId = filters.ventanaId
  if (filters.loteriaId && filters.loteriaId.length > 0) {
    params.loteriaId = filters.loteriaId.join(',')
  }
  if (filters.betType && filters.betType !== 'all') params.betType = filters.betType
  
  return params
}

/**
 * Wrapper genérico para queries con soporte ETag
 */
async function fetchWithETag<T>(
  endpoint: string,
  params: Record<string, any> = {}
): Promise<T> {
  const cacheKey = `${endpoint}:${JSON.stringify(params)}`
  const etag = etagCache.get(cacheKey)
  
  const headers: Record<string, string> = {}
  if (etag) {
    headers['If-None-Match'] = etag
  }
  
  try {
    const response: any = await apiClient.get(endpoint, params, { headers })
    
    // Guardar ETag si viene en la respuesta
    if (response?.meta?.etag) {
      etagCache.set(cacheKey, response.meta.etag)
    }
    
    return response
  } catch (error: any) {
    // Si es 304 Not Modified, devolver null y React Query usará datos cacheados
    if (error?.response?.status === 304) {
      throw error // React Query manejará esto correctamente
    }
    throw error
  }
}

// ============================================================
// DASHBOARD PRINCIPAL
// ============================================================
export function useDashboard(
  filters: DashboardFilters,
  options?: Omit<UseQueryOptions<DashboardResponse>, 'queryKey' | 'queryFn'>
) {
  return useQuery<DashboardResponse>({
    queryKey: ['dashboard', 'main', filters],
    queryFn: () => fetchWithETag<DashboardResponse>(
      '/admin/dashboard',
      buildQueryParams(filters)
    ),
    staleTime: 5 * 60 * 1000, // 5 minutos
    refetchOnMount: false, // Evitar refetches automáticos excesivos
    refetchOnWindowFocus: false,
    retry: 2,
    ...options,
  })
}

// ============================================================
// TIME SERIES
// ============================================================
export function useDashboardTimeSeries(
  filters: DashboardFilters & { 
    granularity?: 'hour' | 'day' | 'week' | 'month'
    compare?: boolean 
  },
  options?: Omit<UseQueryOptions<TimeSeriesResponse>, 'queryKey' | 'queryFn'>
) {
  return useQuery<TimeSeriesResponse>({
    queryKey: ['dashboard', 'timeseries', filters],
    queryFn: () => fetchWithETag<TimeSeriesResponse>(
      '/admin/dashboard/timeseries',
      {
        ...buildQueryParams(filters),
        granularity: filters.granularity,
        compare: filters.compare,
      }
    ),
    staleTime: 5 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    retry: 2,
    ...options,
  })
}

// ============================================================
// EXPOSICIÓN / RIESGO
// ============================================================
export function useDashboardExposure(
  filters: DashboardFilters & { top?: number },
  options?: Omit<UseQueryOptions<ExposureResponse>, 'queryKey' | 'queryFn'>
) {
  return useQuery<ExposureResponse>({
    queryKey: ['dashboard', 'exposure', filters],
    queryFn: () => fetchWithETag<ExposureResponse>(
      '/admin/dashboard/exposure',
      {
        ...buildQueryParams(filters),
        top: filters.top || 20,
      }
    ),
    staleTime: 5 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    retry: 2,
    ...options,
  })
}

// ============================================================
// CXC (Cuentas por Cobrar)
// ============================================================
export function useDashboardCxC(
  filters: DashboardFilters & { aging?: boolean },
  options?: Omit<UseQueryOptions<CxCResponse>, 'queryKey' | 'queryFn'>
) {
  return useQuery<CxCResponse>({
    queryKey: ['dashboard', 'cxc', filters],
    queryFn: () => fetchWithETag<CxCResponse>(
      '/admin/dashboard/cxc',
      {
        ...buildQueryParams(filters),
        aging: filters.aging,
      }
    ),
    staleTime: 5 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    retry: 2,
    ...options,
  })
}

// ============================================================
// CXP (Cuentas por Pagar)
// ============================================================
export function useDashboardCxP(
  filters: DashboardFilters & { aging?: boolean },
  options?: Omit<UseQueryOptions<CxPResponse>, 'queryKey' | 'queryFn'>
) {
  return useQuery<CxPResponse>({
    queryKey: ['dashboard', 'cxp', filters],
    queryFn: () => fetchWithETag<CxPResponse>(
      '/admin/dashboard/cxp',
      {
        ...buildQueryParams(filters),
        aging: filters.aging,
      }
    ),
    staleTime: 5 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    retry: 2,
    ...options,
  })
}

// ============================================================
// GANANCIA (COMISIONES)
// ============================================================
export function useDashboardGanancia(
  filters: DashboardFilters & { dimension: GananciaDimension },
  options?: Omit<UseQueryOptions<GananciaResponse>, 'queryKey' | 'queryFn'>
) {
  return useQuery<GananciaResponse>({
    queryKey: ['dashboard', 'ganancia', filters],
    queryFn: () => fetchWithETag<GananciaResponse>(
      '/admin/dashboard/ganancia',
      {
        ...buildQueryParams(filters),
        dimension: filters.dimension,
      }
    ),
    staleTime: 5 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    retry: 2,
    ...options,
  })
}

// ============================================================
// VENDEDORES
// ============================================================
export function useDashboardVendedores(
  filters: DashboardFilters & { 
    page?: number
    pageSize?: number
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
  },
  options?: Omit<UseQueryOptions<VendedoresResponse>, 'queryKey' | 'queryFn'>
) {
  return useQuery<VendedoresResponse>({
    queryKey: ['dashboard', 'vendedores', filters],
    queryFn: () => fetchWithETag<VendedoresResponse>(
      '/admin/dashboard/vendedores',
      {
        ...buildQueryParams(filters),
        page: filters.page || 1,
        pageSize: filters.pageSize || 20,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
      }
    ),
    staleTime: 5 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    retry: 2,
    ...options,
  })
}

// ============================================================
// EXPORT (mutation - no usar useQuery)
// ============================================================
export async function exportDashboard(
  filters: DashboardFilters,
  format: ExportFormat,
  sections?: Array<'kpis' | 'ventanas' | 'loterias' | 'vendedores' | 'exposure' | 'finanzas'>
): Promise<ExportResponse> {
  const params = {
    ...buildQueryParams(filters),
    format,
    sections: sections?.join(','),
  }
  
  const response: any = await apiClient.get('/admin/dashboard/export', params)
  
  // Si viene URL, descargar automáticamente
  if (response.url) {
    window.open(response.url, '_blank')
  }
  
  return response
}

// ============================================================
// HELPER: Limpiar cache de ETags
// ============================================================
export function clearDashboardETagCache() {
  etagCache.clear()
}

