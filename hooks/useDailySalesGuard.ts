import { useMemo } from 'react'
import { useTodayTicketsQuery } from './useTickets'
import type { RestrictionRule } from '@/types/models.types'

export type DailySalesGuardParams = {
  vendorMode: 'none' | 'ventana' | 'admin'
  user: { id?: string | null; ventanaId?: string | null; bancaId?: string | null } | null | undefined
  vendedorId?: string | null
  vendedorVentanaId?: string | null
  restrictions: RestrictionRule[]
  jugadas: Array<{ amount?: string | number }>
}

export function useDailySalesGuard({ vendorMode, user, vendedorId, vendedorVentanaId, restrictions, jugadas }: DailySalesGuardParams) {
  // Decide scope for today sales query
  const scopeVendedorId = useMemo(() => {
    if (vendorMode === 'none') return user?.id ?? undefined
    return vendedorId ?? undefined
  }, [vendorMode, user?.id, vendedorId])

  const scopeVentanaId = useMemo(() => {
    if (vendorMode === 'none') return user?.ventanaId ?? undefined
    if (vendorMode === 'ventana') return user?.ventanaId ?? undefined
    // admin
    return vendedorVentanaId ?? undefined
  }, [vendorMode, user?.ventanaId, vendedorVentanaId])

  const { data: todayResp } = useTodayTicketsQuery(scopeVentanaId, scopeVendedorId)

  // Unwrap tickets array defensively
  const todayTickets = useMemo(() => {
    const body: any = todayResp as any
    if (!body) return [] as any[]
    if (Array.isArray(body)) return body
    if (Array.isArray(body?.data)) return body.data
    return [] as any[]
  }, [todayResp])

  const currentTotal = useMemo(
    () => todayTickets.reduce((sum, t: any) => sum + (Number(t?.totalAmount) || 0), 0),
    [todayTickets]
  )

  const pendingTotal = useMemo(
    () => jugadas.reduce((sum, j) => sum + (Number(typeof j.amount === 'string' ? j.amount.replace(/\D/g, '') : j.amount) || 0), 0),
    [jugadas]
  )

  const dailyLimit = useMemo(() => getDailyLimitFromRules(restrictions, {
    userId: scopeVendedorId ?? undefined,
    ventanaId: scopeVentanaId ?? undefined,
    bancaId: user?.bancaId ?? undefined,
  }), [restrictions, scopeVendedorId, scopeVentanaId, user?.bancaId])

  const exceeds = useMemo(() => currentTotal + pendingTotal > dailyLimit, [currentTotal, pendingTotal, dailyLimit])

  return {
    currentTotal,
    pendingTotal,
    dailyLimit,
    exceeds,
  }
}

function getDailyLimitFromRules(rules: RestrictionRule[], ids: { userId?: string; ventanaId?: string; bancaId?: string }) {
  const { userId, ventanaId, bancaId } = ids
  const pick = (fn: (r: RestrictionRule) => boolean) => rules.find((r) => fn(r) && r.maxTotal != null)
  const byUser = userId ? pick((r) => r.userId === userId) : undefined
  if (byUser?.maxTotal) return Number(byUser.maxTotal)
  const byVentana = ventanaId ? pick((r) => r.ventanaId === ventanaId) : undefined
  if (byVentana?.maxTotal) return Number(byVentana.maxTotal)
  const byBanca = bancaId ? pick((r) => r.bancaId === bancaId) : undefined
  if (byBanca?.maxTotal) return Number(byBanca.maxTotal)
  return Number.POSITIVE_INFINITY
}

