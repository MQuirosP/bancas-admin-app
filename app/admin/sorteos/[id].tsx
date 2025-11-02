// app/admin/sorteos/[id].tsx
import React, { useMemo, useState } from 'react'
import { YStack, XStack, Text, Spinner, Separator, ScrollView, Sheet } from 'tamagui'
import { Card, Button } from '@/components/ui'
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
import { Trash2, RotateCcw, ArrowLeft } from '@tamagui/lucide-icons'

export default function SorteoDetailScreen() {
  // ⚠️ TODOS los hooks deben ir arriba, antes de cualquier return condicional
  const { id: raw } = useLocalSearchParams<{ id?: string | string[] }>()
  const id = Array.isArray(raw) ? raw[0] : raw

  const toast = useToast()
  const qc = useQueryClient()
  const { confirm, ConfirmRoot } = useConfirm()
  const { user } = useAuth()
  const admin = isAdmin(user?.role!)

  const [showEvaluate, setShowEvaluate] = useState(false)
  const [winnersOpen, setWinnersOpen] = useState(false)

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
    mutationFn: (body: SorteoFormValues) => apiClient.patch(`/sorteos/${id}`, body),
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

  // Returns condicionales DESPUÉS de declarar todos los hooks
  if (!id) {
    return (
      <ScrollView flex={1} backgroundColor="$background">
        <YStack f={1} p="$4" gap="$3" maxWidth={820} alignSelf="center" width="100%">
          <Text fontSize="$7" fontWeight="700">Sorteo no encontrado</Text>
          <Button onPress={() => safeBack('/admin/sorteos')} backgroundColor="$background" borderColor="$borderColor" borderWidth={1} maxWidth={180}>
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
          <Button onPress={() => safeBack('/admin/sorteos')} backgroundColor="$background" borderColor="$borderColor" borderWidth={1} maxWidth={180}>
            <Text>Volver</Text>
          </Button>
        </YStack>
      </ScrollView>
    )
  }

  const s: Sorteo = data
  const isActive = (s as any).isActive !== false
  const flag = (s as any).isActive
  const rowActive = flag === undefined ? (s.status === 'OPEN' || s.status === 'SCHEDULED') : flag === true
  const isEvaluatedOrClosed = s.status === 'EVALUATED' || s.status === 'CLOSED'

  return (
    <ScrollView flex={1} backgroundColor="$background">
      <YStack padding="$4" gap="$4" maxWidth={820} alignSelf="center" width="100%">
        {/* Header */}
        <XStack jc="space-between" ai="center" gap="$2" flexWrap="wrap">
          <XStack ai="center" gap="$2">
            <Button
              size="$3"
              icon={(p:any)=> <ArrowLeft {...p} size={24} />}
              onPress={() => safeBack('/admin/sorteos')}
              backgroundColor="transparent"
              borderWidth={0}
              hoverStyle={{ backgroundColor: 'transparent' }}
              pressStyle={{ scale: 0.98 }}
            />
            <Text fontSize="$8" fontWeight="bold">{s.name}</Text>
            <ActiveBadge active={rowActive} />
            {(isLoading || lotFetching) && <Spinner size="small" />}
          </XStack>

          {admin && (
            <XStack gap="$2" flexWrap="wrap">
              {/* SCHEDULED: Abrir o Eliminar */}
              {s.status === 'SCHEDULED' && (
                <>
                  <Button
                    backgroundColor="$blue4"
                    borderColor="$blue8"
                    borderWidth={1}
                    hoverStyle={{ backgroundColor: '$blue5', scale: 1.02 }}
                    pressStyle={{ backgroundColor: '$blue6', scale: 0.98 }}
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
                  <Button
                    backgroundColor="$red4"
                    borderColor="$red8"
                    borderWidth={1}
                    icon={Trash2}
                    hoverStyle={{ backgroundColor: '$red5', scale: 1.02 }}
                    pressStyle={{ backgroundColor: '$red6', scale: 0.98 }}
                    onPress={() => askDelete(s)}
                  >
                    <Text>Eliminar</Text>
                  </Button>
                </>
              )}

              {/* OPEN: Cerrar y Evaluar */}
              {s.status === 'OPEN' && (
                <>
                  <Button
                    backgroundColor="$gray4"
                    borderColor="$gray8"
                    borderWidth={1}
                    hoverStyle={{ backgroundColor: '$gray5', scale: 1.02 }}
                    pressStyle={{ backgroundColor: '$gray6', scale: 0.98 }}
                    disabled={mClose.isPending}
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
                  >
                    {mClose.isPending ? <Spinner size="small" /> : <Text>Cerrar</Text>}
                  </Button>
                  <Button
                    backgroundColor="$yellow4"
                    borderColor="$yellow8"
                    borderWidth={1}
                    hoverStyle={{ backgroundColor: '$yellow5', scale: 1.02 }}
                    pressStyle={{ backgroundColor: '$yellow6', scale: 0.98 }}
                    onPress={() => setShowEvaluate(true)}
                  >
                    <Text>Evaluar</Text>
                  </Button>
                </>
              )}

              {/* CLOSED: Restaurar */}
              {s.status === 'CLOSED' && (
                <Button
                  icon={RotateCcw}
                  onPress={() => askRestore(s)}
                  disabled={mRestore.isPending}
                >
                  {mRestore.isPending ? <Spinner size="small" /> : <Text>Restaurar</Text>}
                </Button>
              )}

              {/* EVALUATED: Ningún botón */}
            </XStack>
          )}
        </XStack>

        {/* Edit o detalle */}
        {!isEvaluatedOrClosed && isActive ? (
          <SorteoForm
            mode="edit"
            initial={s}
            loterias={loterias}
            submitting={mUpdate.isPending}
            onSubmit={(vals) => mUpdate.mutate(vals)}
            onCancel={() => safeBack('/admin/sorteos')}
          />
        ) : (
          <Card padding="$4" backgroundColor="$backgroundHover" borderColor="$borderColor" borderWidth={1}>
            <YStack gap="$4">
              {/* Header detalle + botones */}
              <XStack jc="space-between" ai="center" fw="wrap" gap="$2">
                <Text fontSize="$6" fontWeight="700">Detalle del sorteo</Text>
                <XStack gap="$2" fw="wrap">
                  {/* Solo mostrar botón de tickets ganadores si está EVALUATED */}
                  {s.status === 'EVALUATED' && (
                    <Button
                      onPress={() => setWinnersOpen(true)}
                      backgroundColor="$purple4"
                      borderColor="$purple8"
                      borderWidth={1}
                      hoverStyle={{ backgroundColor: '$purple5' }}
                      pressStyle={{ backgroundColor: '$purple6', scale: 0.98 }}
                    >
                      <Text>Ver tickets ganadores</Text>
                    </Button>
                  )}

                  <Button
                    onPress={() => safeBack('/admin/sorteos')}
                    backgroundColor="$background"
                    borderColor="$borderColor"
                    borderWidth={1}
                    hoverStyle={{ backgroundColor: '$backgroundHover' }}
                    pressStyle={{ backgroundColor: '$backgroundPress', scale: 0.98 }}
                  >
                    <Text>Volver</Text>
                  </Button>
                </XStack>
              </XStack>

              {/* Estilo vertical */}
              <YStack gap="$3">
                <XStack gap="$2" ai="center" fw="wrap">
                  <Text color="$textSecondary" fontWeight="700" minWidth={110}>Lotería:</Text>
                  <Text color="$textPrimary">{s.loteria?.name ?? s.loteriaId}</Text>
                </XStack>

                <XStack gap="$2" ai="center" fw="wrap">
                  <Text color="$textSecondary" fontWeight="700" minWidth={110}>Programado:</Text>
                  {/* Backend envía hora LOCAL de Costa Rica (sin 'Z') */}
                  <Text color="$textPrimary">{new Date(s.scheduledAt as any).toLocaleString()}</Text>
                </XStack>

                <XStack gap="$2" ai="center" fw="wrap">
                  <Text color="$textSecondary" fontWeight="700" minWidth={110}>Estado:</Text>
                  <Text
                    px="$2"
                    py={2}
                    borderRadius="$2"
                    borderWidth={1}
                    fontWeight="700"
                    backgroundColor={
                      s.status === 'OPEN' ? '$green3' :
                      s.status === 'SCHEDULED' ? '$blue3' :
                      s.status === 'EVALUATED' ? '$yellow3' :
                      '$gray3'
                    }
                    color={
                      s.status === 'OPEN' ? '$green12' :
                      s.status === 'SCHEDULED' ? '$blue12' :
                      s.status === 'EVALUATED' ? '$yellow12' :
                      '$gray12'
                    }
                    borderColor={
                      s.status === 'OPEN' ? '$green8' :
                      s.status === 'SCHEDULED' ? '$blue8' :
                      s.status === 'EVALUATED' ? '$yellow8' :
                      '$gray8'
                    }
                  >
                    {s.status}
                  </Text>
                </XStack>

                {!!s.winningNumber && (
                  <XStack gap="$2" ai="center" fw="wrap">
                    <Text color="$textSecondary" fontWeight="700" minWidth={110}>Ganador:</Text>
                    <Text
                      fontSize="$5"
                      fontWeight="800"
                      px="$2"
                      py={2}
                      borderRadius="$2"
                      backgroundColor="$purple3"
                      color="$purple12"
                      borderWidth={1}
                      borderColor="$purple8"
                    >
                      {s.winningNumber}
                    </Text>
                  </XStack>
                )}

                {(['EVALUATED', 'CLOSED'] as const).includes(s.status as any) && (() => {
                  const anyS = s as any
                  const x =
                    (typeof anyS.extraMultiplierX === 'number' ? anyS.extraMultiplierX : null) ??
                    (typeof anyS?.extraMultiplier?.valueX === 'number' ? anyS.extraMultiplier.valueX : null)

                  const code: string | null =
                    (anyS.extraMultiplier?.name && String(anyS.extraMultiplier.name).trim()) ||
                    (anyS.extraOutcomeCode && String(anyS.extraOutcomeCode).trim()) ||
                    null

                  if (x == null && !code) return null

                  const parts: string[] = []
                  if (x != null) parts.push(`X ${x}`)
                  if (code) parts.push(code)
                  const label = parts.join(' · ')

                  return (
                    <XStack gap="$2" ai="center" fw="wrap">
                      <Text color="$textSecondary" fontWeight="700" minWidth={110}>Reventado:</Text>
                      <Text
                        fontSize="$4"
                        fontWeight="700"
                        px="$2"
                        py={2}
                        borderRadius="$2"
                        backgroundColor="$orange3"
                        color="$orange12"
                        borderWidth={1}
                        borderColor="$orange8"
                      >
                        {label}
                      </Text>
                    </XStack>
                  )
                })()}
              </YStack>

              {/* Sheet/Modal ganadores (placeholder) */}
              <Sheet modal open={winnersOpen} onOpenChange={setWinnersOpen} snapPoints={[85]}>
                <Sheet.Overlay />
                <Sheet.Frame p="$4" ai="stretch" gap="$3">
                  <XStack jc="space-between" ai="center">
                    <Text fontSize="$6" fontWeight="700">Tickets ganadores</Text>
                    <Button size="$2" onPress={() => setWinnersOpen(false)}>
                      <Text>Cerrar</Text>
                    </Button>
                  </XStack>
                  <Text color="$textSecondary">Próximamente…</Text>
                </Sheet.Frame>
              </Sheet>
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
        <ConfirmRoot />
      </YStack>
    </ScrollView>
  )
}
