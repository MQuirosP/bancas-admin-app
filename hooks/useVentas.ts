// hooks/useVentas.ts
import { useQuery } from '@tanstack/react-query'
import { VentasApi, type VentasListQuery } from '@/lib/api.ventas'

export function useVentasSummary(q: Omit<VentasListQuery, 'page' | 'pageSize'>) {
  return useQuery({
    queryKey: ['ventas', 'summary', q],
    queryFn: () => VentasApi.summary(q).then((r) => r.data),
    staleTime: 30_000,
  })
}

export function useVentasBreakdown(q: Omit<VentasListQuery, 'page' | 'pageSize'> & { dimension: 'ventana' | 'vendedor' | 'loteria' | 'sorteo' | 'numero'; top?: number }) {
  return useQuery({
    queryKey: ['ventas', 'breakdown', q],
    queryFn: () => VentasApi.breakdown(q).then((r) => r.data),
    staleTime: 30_000,
  })
}

export function useVentasTimeseries(q: Omit<VentasListQuery, 'page' | 'pageSize'> & { granularity?: 'hour' | 'day' | 'week'; dimension?: string }) {
  return useQuery({
    queryKey: ['ventas', 'timeseries', q],
    queryFn: () => VentasApi.timeseries(q).then((r) => r.data),
    staleTime: 30_000,
  })
}

