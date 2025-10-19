// app/admin/ventanas/[id].tsx
import React, { useEffect, useMemo, useState } from 'react'
import { YStack, XStack, Text, Button, Card, ScrollView, Spinner } from 'tamagui'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { ArrowLeft, RefreshCw, Save, Trash2, RotateCcw } from '@tamagui/lucide-icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/useToast'
import { Toolbar } from '@/components/ui/Toolbar'
import ActiveBadge from '@/components/ui/ActiveBadge'
import { useConfirm } from '@/components/ui/Confirm'
import VentanaForm, { VentanaFormValues } from '@/components/ventanas/VentanaForm'
import {
  getVentana, updateVentana, softDeleteVentana, restoreVentana, listBancasLite
} from '@/services/ventanas.service'

export default function VentanaDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const toast = useToast()
  const qc = useQueryClient()
  const { confirm, ConfirmRoot } = useConfirm()

  const qVentana = useQuery({
    queryKey: ['ventanas', 'detail', id],
    queryFn: () => getVentana(id!),
    enabled: !!id,
    staleTime: 30_000,
  })

  const qBancas = useQuery({
    queryKey: ['bancas', 'lite'],
    queryFn: listBancasLite,
    staleTime: 60_000,
  })

  const initial: VentanaFormValues | null = useMemo(() => {
    const v = qVentana.data as any
    if (!v) return null
    return {
      bancaId: v.bancaId ?? '',
      name: v.name ?? '',
      code: v.code ?? '',
      email: v.email ?? '',
      phone: v.phone ?? '',
      address: v.address ?? '',
      commissionMarginX: v.commissionMarginX ?? null,
      isActive: v.isActive !== false,
    }
  }, [qVentana.data])

  const [values, setValues] = useState<VentanaFormValues | null>(initial)
  useEffect(() => setValues(initial), [initial])

  const setField: <K extends keyof VentanaFormValues>(key: K, val: VentanaFormValues[K]) => void =
    (key, val) => setValues((prev) => (prev ? { ...prev, [key]: val } : prev))

  const mUpdate = useMutation({
    mutationFn: (payload: VentanaFormValues) => updateVentana(id!, {
      bancaId: payload.bancaId,
      name: payload.name.trim(),
      code: payload.code.trim() || null,
      email: payload.email.trim() || null,
      phone: payload.phone.trim() || null,
      address: payload.address.trim() || null,
      commissionMarginX: payload.commissionMarginX == null ? null : Number(payload.commissionMarginX),
      isActive: !!payload.isActive,
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['ventanas'] }); toast.success('Cambios guardados') },
    onError: (e: any) => toast.error(e?.message || 'No fue posible guardar'),
  })

  const mDelete = useMutation({
    mutationFn: () => softDeleteVentana(id!),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['ventanas'] }); toast.success('Ventana eliminada'); router.back() },
  })
  const mRestore = useMutation({
    mutationFn: () => restoreVentana(id!),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['ventanas'] }); toast.success('Ventana restaurada'); qVentana.refetch() },
  })

  const onSave = () => {
    if (!values) return
    if (!values.name || values.name.trim().length < 2) return toast.error('El nombre es obligatorio')
    if (!values.bancaId) return toast.error('Selecciona una banca')
    mUpdate.mutate(values)
  }

  const onDelete = async () => {
    const ok = await confirm({
      title: 'Confirmar eliminación',
      description: `¿Eliminar la ventana “${qVentana.data?.name}”?`,
      okText: 'Eliminar',
    })
    if (ok) mDelete.mutate()
  }

  const onRestore = async () => {
    const ok = await confirm({
      title: 'Restaurar ventana',
      description: `¿Restaurar la ventana “${qVentana.data?.name}”?`,
      okText: 'Restaurar',
    })
    if (ok) mRestore.mutate()
  }

  const isDeleted = (qVentana.data as any)?.isDeleted === true
  const isActive = (values?.isActive ?? true) === true

  return (
    <ScrollView flex={1} backgroundColor="$background" contentContainerStyle={{ flexGrow: 1 }}>
      <YStack flex={1} padding="$4" gap="$4">
        {/* Header */}
        <XStack jc="space-between" ai="center" gap="$3" flexWrap="wrap">
          <XStack ai="center" gap="$2">
            <Button
              icon={ArrowLeft}
              onPress={() => router.back()}
              bg="$background"
              hoverStyle={{ bg: '$backgroundHover', scale: 1.02 }}
              pressStyle={{ scale: 0.98 }}
            >
              <Text>Volver</Text>
            </Button>

            <XStack ai="center" gap="$2">
              <Text fontSize="$8" fontWeight="bold">{qVentana.data?.name ?? 'Ventana'}</Text>
              {typeof isActive === 'boolean' && <ActiveBadge active={isActive} />}
              {(qVentana.isFetching || qBancas.isFetching) && <Spinner size="small" />}
            </XStack>
          </XStack>

          <XStack gap="$2" flexWrap="wrap">
            {!isDeleted ? (
              <Button icon={Trash2} onPress={onDelete} hoverStyle={{ bg: '$backgroundHover', scale: 1.02 }} pressStyle={{ scale: 0.98 }}>
                <Text>Eliminar</Text>
              </Button>
            ) : (
              <Button icon={RotateCcw} onPress={onRestore} disabled={mRestore.isPending}>
                {mRestore.isPending ? <Spinner size="small" /> : <Text>Restaurar</Text>}
              </Button>
            )}
            <Button icon={RefreshCw} onPress={() => { qVentana.refetch(); qBancas.refetch() }}>
              <Text>Refrescar</Text>
            </Button>
            <Button
              icon={Save}
              onPress={onSave}
              bg="$primary"
              color="$background"
              hoverStyle={{ bg: '$primaryHover', scale: 1.02 }}
              pressStyle={{ bg: '$primaryPress', scale: 0.98 }}
              disabled={mUpdate.isPending || !values}
            >
              {mUpdate.isPending ? <Spinner size="small" /> : <Text>Guardar</Text>}
            </Button>
          </XStack>
        </XStack>

        {/* Contenido */}
        {qVentana.isLoading ? (
          <Card padding="$6" elevate><Text>Cargando ventana…</Text></Card>
        ) : qVentana.isError || !values ? (
          <Card padding="$6" elevate bg="$backgroundHover" borderColor="$error" borderWidth={1}>
            <Text color="$error">No fue posible cargar la ventana.</Text>
          </Card>
        ) : (
          <Toolbar>
            <VentanaForm
              values={values}
              setField={setField}
              bancas={qBancas.data ?? []}
              loadingBancas={qBancas.isLoading}
              errorBancas={qBancas.isError}
              onRetryBancas={() => qBancas.refetch()}
            />
          </Toolbar>
        )}

        <ConfirmRoot />
      </YStack>
    </ScrollView>
  )
}
