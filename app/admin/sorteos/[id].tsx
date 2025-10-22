// app/admin/sorteos/[id].tsx
import React, { useMemo, useState } from 'react'
import { YStack, XStack, Text, Card, Button, Spinner, Separator, ScrollView } from 'tamagui'
import { useLocalSearchParams } from 'expo-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/useToast'
import { useConfirm } from '@/components/ui/Confirm'
import { SorteosApi } from '@/lib/api.sorteos'
import type { Loteria, Sorteo } from '@/types/models.types'
import SorteoEvaluateModal from '@/components/sorteos/SorteoEvaluateModal'
import SorteoForm, { SorteoFormValues } from '@/components/sorteos/SorteoForm'
import ActiveBadge from '@/components/ui/ActiveBadge'
import { useAuth } from '@/hooks/useAuth'
import { isAdmin } from '@/utils/role'
import { apiClient } from '@/lib/api.client'
import { safeBack } from '@/lib/navigation'
import { Trash2, RotateCcw } from '@tamagui/lucide-icons'

export default function SorteoDetailScreen() {
  const { id: raw } = useLocalSearchParams<{ id?: string | string[] }>()
  const id = Array.isArray(raw) ? raw[0] : raw
  const toast = useToast()
  const qc = useQueryClient()
  const { confirm, ConfirmRoot } = useConfirm()
  const { user } = useAuth()
  const admin = isAdmin(user?.role!)

  const [showEvaluate, setShowEvaluate] = useState(false)

  // Sorteo
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['sorteos', id],
    enabled: !!id,
    queryFn: () => SorteosApi.get(id!),
    staleTime: 30_000,
  })

  // Loterías para el form (select)
  const { data: lotResp, isFetching: lotFetching } = useQuery({
    queryKey: ['loterias', 'select'],
    queryFn: () => apiClient.get<any>('/loterias'),
    staleTime: 60_000,
  })
  const loterias: Pick<Loteria, 'id' | 'name'>[] = useMemo(() => {
    if (!lotResp) return []
    const arr = Array.isArray(lotResp) ? lotResp : (lotResp?.data ?? [])
    return (arr ?? []).map((l: any) => ({ id: l.id, name: l.name }))
  }, [lotResp])

  // Mutaciones abrir/cerrar/eliminar/restaurar
  const mOpen = useMutation({
    mutationFn: () => SorteosApi.open(id!),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sorteos'] }); toast.success('Sorteo abierto'); refetch() },
    onError: (e: any) => toast.error(e?.message || 'No fue posible abrir'),
  })

  const mClose = useMutation({
    mutationFn: () => SorteosApi.close(id!),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sorteos'] }); toast.success('Sorteo cerrado'); refetch() },
    onError: (e: any) => toast.error(e?.message || 'No fue posible cerrar'),
  })

  const mDelete = useMutation({
    mutationFn: () => apiClient.deleteWithBody(`/sorteos/${id}`, {}), // soft-delete
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sorteos'] })
      toast.success('Sorteo eliminado')
      safeBack('/admin/sorteos')
    },
    onError: (e: any) => toast.error(e?.message || 'No fue posible eliminar'),
  })

  const mRestore = useMutation({
    mutationFn: () => apiClient.patch(`/sorteos/${id}/restore`, {}),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sorteos'] }); toast.success('Sorteo restaurado'); refetch() },
    onError: (e: any) => toast.error(e?.message || 'No fue posible restaurar'),
  })

  // Mutación actualizar sorteo
  const mUpdate = useMutation({
    mutationFn: (body: SorteoFormValues) => apiClient.put(`/sorteos/${id}`, body),
    onSuccess: (updated: any) => {
      const s: Sorteo = Array.isArray(updated) ? (updated as any)[0] : (updated?.data ?? updated)
      qc.invalidateQueries({ queryKey: ['sorteos'] })
      qc.setQueryData(['sorteos', id], s || updated)
      toast.success('Sorteo actualizado')
      refetch()
    },
    onError: (e: any) => toast.error(e?.message || 'No fue posible guardar cambios'),
  })

  const askDelete = async (s: Sorteo) => {
    const ok = await confirm({
      title: 'Confirmar eliminación',
      description: `¿Eliminar el sorteo “${s.name}”?`,
      okText: 'Eliminar',
      cancelText: 'Cancelar',
    })
    if (ok) mDelete.mutate()
  }

  const askRestore = async (s: Sorteo) => {
    const ok = await confirm({
      title: 'Restaurar sorteo',
      description: `¿Restaurar “${s.name}”?`,
      okText: 'Restaurar',
      cancelText: 'Cancelar',
    })
    if (ok) mRestore.mutate()
  }

  if (!id) {
    return (
      <ScrollView flex={1} backgroundColor="$background">
        <YStack f={1} p="$4" gap="$3" maxWidth={820} alignSelf="center" width="100%">
          <Text fontSize="$7" fontWeight="700">Sorteo no encontrado</Text>
          <Button onPress={() => safeBack('/admin/sorteos')} bg="$background" borderColor="$borderColor" borderWidth={1} maxWidth={180}>
            <Text>Volver</Text>
          </Button>
        </YStack>
      </ScrollView>
    )
  }

  if (isLoading) {
    return (
      <ScrollView flex={1} backgroundColor="$background">
        <YStack f={1} p="$4" maxWidth={820} alignSelf="center" width="100%">
          <XStack ai="center" gap="$2">
            <Spinner />
            <Text>Cargando sorteo…</Text>
          </XStack>
        </YStack>
      </ScrollView>
    )
  }

  if (isError || !data) {
    return (
      <ScrollView flex={1} backgroundColor="$background">
        <YStack f={1} p="$4" gap="$3" maxWidth={820} alignSelf="center" width="100%">
          <Text fontSize="$7" fontWeight="700">Error al cargar</Text>
          <Button onPress={() => safeBack('/admin/sorteos')} bg="$background" borderColor="$borderColor" borderWidth={1} maxWidth={180}>
            <Text>Volver</Text>
          </Button>
        </YStack>
      </ScrollView>
    )
  }

  const s: Sorteo = data
  const isDeleted = (s as any).isDeleted === true
  const flag = (s as any).isActive
  const rowActive = flag === undefined ? (s.status === 'OPEN' || s.status === 'SCHEDULED') : flag === true
  const isEvaluatedOrClosed = s.status === 'EVALUATED' || s.status === 'CLOSED'

  return (
    <ScrollView flex={1} backgroundColor="$background">
      <YStack padding="$4" gap="$4" maxWidth={820} alignSelf="center" width="100%">
        {/* Header */}
        <XStack jc="space-between" ai="center" gap="$2" flexWrap="wrap">
          <XStack ai="center" gap="$2">
            <Text fontSize="$8" fontWeight="bold">{s.name}</Text>
            <ActiveBadge active={rowActive} />
            {(isLoading || lotFetching) && <Spinner size="small" />}
          </XStack>

          {admin && (
            <XStack gap="$2" flexWrap="wrap">
              {/* Abrir solo desde SCHEDULED */}
              {s.status === 'SCHEDULED' && (
                <Button
                  backgroundColor="$blue4"
                  borderColor="$blue8"
                  hoverStyle={{ backgroundColor: '$blue5', scale: 1.02 }}
                  disabled={mOpen.isPending}
                  onPress={async () => {
                    const ok = await confirm({
                      title: '¿Abrir sorteo?',
                      description: 'Pasará a estado OPEN y permitirá ventas.',
                      okText: 'Abrir',
                      cancelText: 'Cancelar',
                    })
                    if (!ok) return
                    mOpen.mutate()
                  }}
                >
                  {mOpen.isPending ? <Spinner size="small" /> : <Text>Abrir</Text>}
                </Button>
              )}

              {/* Evaluar solo en OPEN */}
              {s.status === 'OPEN' && (
                <Button
                  backgroundColor="$green4"
                  borderColor="$green8"
                  hoverStyle={{ backgroundColor: '$green5', scale: 1.02 }}
                  pressStyle={{ scale: 0.98 }}
                  onPress={() => setShowEvaluate(true)}
                >
                  <Text>Evaluar</Text>
                </Button>
              )}

              {/* Cerrar solo en OPEN */}
              {s.status === 'OPEN' && (
                <Button
                  onPress={async () => {
                    const ok = await confirm({
                      title: '¿Cerrar sorteo?',
                      description: 'Pasará a CLOSED y desactivará tickets.',
                      okText: 'Cerrar',
                      cancelText: 'Cancelar',
                    })
                    if (!ok) return
                    mClose.mutate()
                  }}
                  backgroundColor="$gray4"
                  borderColor="$gray8"
                  disabled={mClose.isPending}
                  hoverStyle={{ backgroundColor: '$gray5', scale: 1.02 }}
                  pressStyle={{ scale: 0.98 }}
                  bw={1}
                >
                  {mClose.isPending ? <Spinner size="small" /> : <Text>Cerrar</Text>}
                </Button>
              )}

              {/* Eliminar solo si NO está evaluado ni cerrado */}
              {!isDeleted && !isEvaluatedOrClosed && (
                <Button
                  backgroundColor="$red4"
                  borderColor="$red8"
                  icon={Trash2}
                  hoverStyle={{ backgroundColor: '$red5', scale: 1.02 }}
                  pressStyle={{ scale: 0.98 }}
                  onPress={() => askDelete(s)}
                >
                  <Text>Eliminar</Text>
                </Button>
              )}

              {/* Restaurar si está eliminado */}
              {isDeleted && (
                <Button icon={RotateCcw} onPress={() => askRestore(s)} disabled={mRestore.isPending}>
                  {mRestore.isPending ? <Spinner size="small" /> : <Text>Restaurar</Text>}
                </Button>
              )}
            </XStack>
          )}
        </XStack>

        {/* Edición directa al entrar (solo si no es final ni eliminado); sino, solo lectura */}
        {!isEvaluatedOrClosed && !isDeleted ? (
          <SorteoForm
            mode="edit"
            initial={s}
            loterias={loterias}
            submitting={mUpdate.isPending}
            onSubmit={(vals) => mUpdate.mutate(vals)}
            onCancel={() => safeBack('/admin/sorteos')}
          />
        ) : (
          <Card padding="$4" bg="$backgroundHover" borderColor="$borderColor" borderWidth={1}>
            <YStack gap="$3">
              <XStack jc="space-between" ai="center" fw="wrap" gap="$2">
                <Text fontSize="$6" fontWeight="700">Detalle del sorteo</Text>
                <Button
                  onPress={() => safeBack('/admin/sorteos')}
                  bg="$background"
                  borderColor="$borderColor"
                  borderWidth={1}
                  hoverStyle={{ bg: '$backgroundHover', scale: 1.02 }}
                  pressStyle={{ scale: 0.98 }}
                >
                  <Text>Volver</Text>
                </Button>
              </XStack>

              <YStack gap="$2">
                <Text color="$textSecondary">Lotería: {s.loteria?.name ?? s.loteriaId}</Text>
                <Text color="$textSecondary">Programado: {new Date(s.scheduledAt as any).toLocaleString()}</Text>
                <Text color="$textSecondary">Estado: {s.status}</Text>
                {!!s.winningNumber && <Text color="$textSecondary">Ganador: {s.winningNumber}</Text>}
                {!!s.extraOutcomeCode && <Text color="$textSecondary">Código extra: {s.extraOutcomeCode}</Text>}
              </YStack>
            </YStack>
          </Card>
        )}

        {/* Modal evaluar */}
        {showEvaluate && s.status === 'OPEN' && admin && (
          <SorteoEvaluateModal
            sorteoId={s.id}
            onClose={() => setShowEvaluate(false)}
            onSuccess={(updated) => {
              qc.invalidateQueries({ queryKey: ['sorteos'] })
              if (updated) qc.setQueryData(['sorteos', s.id], updated)
              setShowEvaluate(false)
              refetch()
            }}
          />
        )}

        <Separator />
        {/* <Button onPress={() => safeBack('/admin/sorteos')} bg="$background" borderColor="$borderColor" borderWidth={1} maxWidth={180}>
          <Text>Volver</Text>
        </Button> */}

        <ConfirmRoot />
      </YStack>
    </ScrollView>
  )
}
