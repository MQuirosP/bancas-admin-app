/**
 * Hooks para Dashboard Admin v1
 * Con soporte para ETags y cache inteligente
 */

import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { apiClient } from '@/lib/api.client'
import { useDashboardFiltersStore } from '@/store/dashboardFilters.store'
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
  DashboardKPIs,
  TimeSeriesDataPoint,
  DashboardAlert,
  DashboardMeta,
} from '@/types/dashboard.types'

// ============================================================
// DATOS MOCK
// ============================================================

function generateMockKPIs(): DashboardKPIs {
  const baseSales = 125000
  const baseTickets = 5432
  const baseWinners = 342
  const baseCommissions = 12500
  
  return {
    totalSales: baseSales + Math.floor(Math.random() * 20000),
    totalTickets: baseTickets + Math.floor(Math.random() * 500),
    totalWinners: baseWinners + Math.floor(Math.random() * 50),
    totalCommissions: baseCommissions + Math.floor(Math.random() * 2000),
    winRate: 6.3 + Math.random() * 2,
    margin: 18.5 + Math.random() * 5,
    previousPeriod: {
      totalSales: baseSales - 5000,
      totalTickets: baseTickets - 200,
      totalWinners: baseWinners - 20,
      totalCommissions: baseCommissions - 500,
      winRate: 6.0,
      margin: 17.2,
    },
  }
}

function generateMockTimeSeries(granularity: 'hour' | 'day' | 'week' | 'month' = 'day'): TimeSeriesDataPoint[] {
  const points: TimeSeriesDataPoint[] = []
  const now = new Date()
  
  let count = 7
  if (granularity === 'hour') count = 24
  if (granularity === 'week') count = 14
  if (granularity === 'month') count = 12
  
  for (let i = count - 1; i >= 0; i--) {
    const date = new Date(now)
    if (granularity === 'hour') date.setHours(date.getHours() - i)
    else if (granularity === 'day') date.setDate(date.getDate() - i)
    else if (granularity === 'week') date.setDate(date.getDate() - i * 7)
    else if (granularity === 'month') date.setMonth(date.getMonth() - i)
    
    points.push({
      timestamp: date.toISOString(),
      sales: 15000 + Math.floor(Math.random() * 5000),
      commissions: 1500 + Math.floor(Math.random() * 500),
      tickets: 600 + Math.floor(Math.random() * 200),
      winners: 35 + Math.floor(Math.random() * 15),
      payout: 8000 + Math.floor(Math.random() * 3000),
    })
  }
  
  return points
}

function generateMockAlerts(): DashboardAlert[] {
  return [
    {
      id: '1',
      type: 'HIGH_EXPOSURE',
      severity: 'HIGH',
      message: 'Número 47 tiene exposición alta (RD$45,000)',
      suggestedAction: 'Revisar apuestas en este número',
      entity: { type: 'numero', id: '47', name: '47' },
      value: 45000,
      threshold: 40000,
      timestamp: new Date().toISOString(),
    },
    {
      id: '2',
      type: 'LOW_MARGIN',
      severity: 'MEDIUM',
      message: 'Margen bajo en Lotería Nacional (12.5%)',
      suggestedAction: 'Considerar ajustar comisiones',
      entity: { type: 'loteria', id: '1', name: 'Lotería Nacional' },
      value: 12.5,
      threshold: 15,
      timestamp: new Date().toISOString(),
    },
    {
      id: '3',
      type: 'HIGH_CXC',
      severity: 'MEDIUM',
      message: 'CxC pendiente: Listero Centro (RD$8,500)',
      suggestedAction: 'Contactar para cobro',
      entity: { type: 'ventana', id: '1', name: 'Listero Centro' },
      value: 8500,
      threshold: 7000,
      timestamp: new Date().toISOString(),
    },
  ]
}

function generateMockMeta(): DashboardMeta {
  const now = new Date()
  const weekAgo = new Date(now)
  weekAgo.setDate(weekAgo.getDate() - 7)
  
  return {
    range: {
      from: weekAgo.toISOString(),
      to: now.toISOString(),
    },
    queryExecutionTime: 45,
    totalQueries: 3,
    cacheHit: false,
  }
}

function generateMockDashboard(): DashboardResponse {
  return {
    kpis: generateMockKPIs(),
    timeSeries: generateMockTimeSeries('day'),
    byVentana: [],
    byLoteria: [],
    alerts: generateMockAlerts(),
    meta: generateMockMeta(),
  }
}

function generateMockTimeSeriesComparison(granularity: 'hour' | 'day' | 'week' | 'month' = 'day'): TimeSeriesDataPoint[] {
  const points: TimeSeriesDataPoint[] = []
  const now = new Date()
  
  let count = 7
  let periodOffset = 7 // Período anterior: 7 días atrás
  if (granularity === 'hour') {
    count = 24
    periodOffset = 24 // 24 horas atrás
  } else if (granularity === 'week') {
    count = 14
    periodOffset = 14 * 7 // 14 semanas atrás
  } else if (granularity === 'month') {
    count = 12
    periodOffset = 365 // ~12 meses atrás
  }
  
  for (let i = count - 1; i >= 0; i--) {
    const date = new Date(now)
    // Retroceder el período completo y luego avanzar según el índice
    if (granularity === 'hour') {
      date.setHours(date.getHours() - periodOffset - (count - 1 - i))
    } else if (granularity === 'day') {
      date.setDate(date.getDate() - periodOffset - (count - 1 - i))
    } else if (granularity === 'week') {
      date.setDate(date.getDate() - periodOffset - (count - 1 - i) * 7)
    } else if (granularity === 'month') {
      date.setMonth(date.getMonth() - 12 - (count - 1 - i))
    }
    
    // Valores ligeramente menores para el período anterior
    points.push({
      timestamp: date.toISOString(),
      sales: 12000 + Math.floor(Math.random() * 4000), // ~20% menos
      commissions: 1200 + Math.floor(Math.random() * 400),
      tickets: 500 + Math.floor(Math.random() * 150),
      winners: 28 + Math.floor(Math.random() * 12),
      payout: 6500 + Math.floor(Math.random() * 2500),
    })
  }
  
  return points
}

function generateMockTimeSeriesResponse(granularity: 'hour' | 'day' | 'week' | 'month' = 'day'): TimeSeriesResponse {
  return {
    data: generateMockTimeSeries(granularity),
    granularity,
    comparison: generateMockTimeSeriesComparison(granularity), // Siempre generar comparación
    meta: generateMockMeta(),
  }
}

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
  const mockMode = useDashboardFiltersStore((state) => state.mockMode)
  
  return useQuery<DashboardResponse>({
    queryKey: ['dashboard', 'main', filters, mockMode],
    queryFn: async () => {
      if (mockMode) {
        // Simular delay de red
        await new Promise(resolve => setTimeout(resolve, 500))
        return generateMockDashboard()
      }
      return fetchWithETag<DashboardResponse>(
        '/admin/dashboard',
        buildQueryParams(filters)
      )
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    refetchOnMount: false, // Evitar refetches automáticos excesivos
    refetchOnWindowFocus: false,
    retry: mockMode ? 0 : 2, // No retry en modo mock
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
  const mockMode = useDashboardFiltersStore((state) => state.mockMode)
  const granularity = filters.granularity || 'day'
  
  return useQuery<TimeSeriesResponse>({
    queryKey: ['dashboard', 'timeseries', filters, mockMode],
    queryFn: async () => {
      if (mockMode) {
        // Simular delay de red
        await new Promise(resolve => setTimeout(resolve, 400))
        return generateMockTimeSeriesResponse(granularity)
      }
      return fetchWithETag<TimeSeriesResponse>(
        '/admin/dashboard/timeseries',
        {
          ...buildQueryParams(filters),
          granularity: filters.granularity,
          compare: filters.compare,
        }
      )
    },
    staleTime: 5 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    retry: mockMode ? 0 : 2, // No retry en modo mock
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

