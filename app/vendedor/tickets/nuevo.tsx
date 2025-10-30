// app/vendedor/tickets/nuevo.tsx
import React, { useMemo } from 'react'
import { YStack, ScrollView } from 'tamagui'
import { useRouter } from 'expo-router'
import { useMutation, useQuery } from '@tanstack/react-query'
import { apiClient, ApiErrorClass } from '../../../lib/api.client'
import { useAuthStore } from '../../../store/auth.store'
import { Sorteo, SorteoStatus, CreateTicketRequest, RestrictionRule } from '../../../types/models.types'
import { useToast } from '../../../hooks/useToast'
import TicketForm from '@/components/tickets/TicketForm'
import { LoteriasApi } from '@/lib/api.loterias'

type ListResp<T> = T[] | { data: T[]; meta?: any }
function toArray<T>(payload: ListResp<T> | undefined | null): T[] {
  if (!payload) return []
  return Array.isArray(payload) ? payload : Array.isArray((payload as any).data) ? (payload as any).data : []
}

export default function NuevoTicketScreen() {
  const router = useRouter()
  const { success, error } = useToast()
  const { user } = useAuthStore()

  const safeBack = () => {
    try {
      // @ts-ignore
      if (router.canGoBack?.()) router.back()
      else router.replace('/vendedor')
    } catch {
      router.replace('/vendedor')
    }
  }

  // Cargar loterías con rulesJson
  const { data: loteriasResp, isLoading: loadingLoterias } = useQuery({
    queryKey: ['loterias', 'all'],
    queryFn: () => LoteriasApi.list({ pageSize: 100 }),
    staleTime: 60_000,
  })

  // Sorteos abiertos
  const { data: sorteosResp, isLoading: loadingSorteos } = useQuery<ListResp<Sorteo>>({
    queryKey: ['sorteos', 'open'],
    queryFn: () => apiClient.get<ListResp<Sorteo>>('/sorteos', { status: SorteoStatus.OPEN }),
    staleTime: 60_000,
    placeholderData: { data: [] },
  })
  
  // Combinar sorteos con datos completos de loterías (incluyendo rulesJson)
  const sorteos = useMemo(() => {
    const rawSorteos = toArray<Sorteo>(sorteosResp)
    const loterias = loteriasResp?.data || []
    
    return rawSorteos.map(sorteo => {
      const loteria = loterias.find(lot => lot.id === sorteo.loteriaId)
      if (loteria) {
        return {
          ...sorteo,
          loteria: loteria // Reemplazar con la lotería completa que tiene rulesJson
        }
      }
      return sorteo
    })
  }, [sorteosResp, loteriasResp])

  // Restricciones
  const { data: restrictionsResp, isLoading: loadingRestrictions } = useQuery<ListResp<RestrictionRule>>({
    queryKey: ['restrictions'],
    queryFn: async () => {
      try {
        return await apiClient.get<ListResp<RestrictionRule>>('/restrictions')
      } catch {
        return { data: [] }
      }
    },
    staleTime: 60_000,
    placeholderData: { data: [] },
  })
  const restrictions = useMemo(() => toArray<RestrictionRule>(restrictionsResp), [restrictionsResp])

  // Crear ticket (backend infiere ventanaId por userId)
  const createTicketMutation = useMutation({
    mutationFn: (data: Omit<CreateTicketRequest, 'ventanaId'>) => apiClient.post('/tickets', data),
    onSuccess: (res: any) => {
      const created = (res && typeof res === 'object' && 'data' in res) ? (res as any).data : res
      const ticketId = created?.id ?? created?._id
      const num = created?.ticketNumber ?? res?.data?.ticketNumber
      success(`Tiquete ${num ? `#${num} ` : ''}creado correctamente`)
      if (ticketId) router.replace(`/vendedor/tickets/${ticketId}` as any)
      else safeBack()
    },
    onError: (err: ApiErrorClass) => {
      error(err?.message ?? 'No se pudo crear el tiquete')
    },
  })

  return (
    <ScrollView flex={1} backgroundColor={'$background'}>
      <YStack padding="$4" gap="$4" maxWidth={1200} alignSelf="center" width="100%">
        <TicketForm
          sorteos={sorteos}
          restrictions={restrictions}
          user={user}
          restrictionsLoading={loadingSorteos || loadingRestrictions || loadingLoterias}
          loading={createTicketMutation.isPending}
          onCancel={safeBack}
          onSubmit={(payload) => createTicketMutation.mutate(payload)}
        />
      </YStack>
    </ScrollView>
  )
}

