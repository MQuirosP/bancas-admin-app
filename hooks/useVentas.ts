// hooks/useVentas.ts
import { useQuery } from '@tanstack/react-query'
import { VentasApi, type VentasListQuery } from '@/lib/api.ventas'

export function useVentasSummary(q: Omit<VentasListQuery, 'page' | 'pageSize'>) {
  return useQuery({
    queryKey: ['ventas', 'summary', q],
    queryFn: async () => {
      const r: any = await VentasApi.summary(q)
      return r?.data ?? r ?? { ventasTotal: 0, ticketsCount: 0, jugadasCount: 0, payoutTotal: 0, neto: 0, lastTicketAt: null }
    },
    placeholderData: { ventasTotal: 0, ticketsCount: 0, jugadasCount: 0, payoutTotal: 0, neto: 0, lastTicketAt: null },
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    retry: 1,
  })
}

export function useVentasBreakdown(q: Omit<VentasListQuery, 'page' | 'pageSize'> & { dimension: 'ventana' | 'vendedor' | 'loteria' | 'sorteo' | 'numero'; top?: number }) {
  return useQuery({
    queryKey: ['ventas', 'breakdown', q],
    queryFn: async () => {
      const r: any = await VentasApi.breakdown(q)
      return r?.data ?? r ?? []
    },
    placeholderData: [],
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    retry: 1,
  })
}

export function useVentasTimeseries(q: Omit<VentasListQuery, 'page' | 'pageSize'> & { granularity?: 'hour' | 'day' | 'week'; dimension?: string }) {
  return useQuery({
    queryKey: ['ventas', 'timeseries', q],
    queryFn: async () => {
      const r: any = await VentasApi.timeseries(q)
      return r?.data ?? r ?? []
    },
    placeholderData: [],
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    retry: 1,
  })
}
