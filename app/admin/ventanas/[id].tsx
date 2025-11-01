// app/admin/ventanas/[id].tsx
import React, { useMemo } from 'react'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { ScrollView, YStack, Text, XStack, useTheme } from 'tamagui'
import { Button } from '@/components/ui'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient, ApiErrorClass } from '@/lib/api.client'
import VentanaForm, { VentanaFormValues } from '@/components/ventanas/VentanaForm'
import { listBancasLite } from '@/services/ventanas.service'
import { useToast } from '@/hooks/useToast'
import { safeBack } from '@/lib/navigation'
import { Ventana } from '../../../types/models.types'
import { isDirty as isDirtyUtil } from '../../../utils/forms/dirty'
import { ArrowLeft } from '@tamagui/lucide-icons'

export default function EditVentanaScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const qc = useQueryClient()
  const toast = useToast()
  const theme = useTheme()
  const iconColor = (theme?.color as any)?.get?.() ?? '#000'

  const { data: ventana, isLoading: loadingVentana } = useQuery<Ventana>({
    queryKey: ['ventanas', id],
    queryFn: () => apiClient.get<Ventana>(`/ventanas/${id}`),
    enabled: !!id,
  })

  const { data: bancas = [], isLoading: loadingBancas, isError: errorBancas, refetch } = useQuery({
    queryKey: ['bancas', 'lite'],
    queryFn: listBancasLite,
    staleTime: 60_000,
  })

  const updateMutation = useMutation({
    mutationFn: (payload: Partial<VentanaFormValues>) =>
      apiClient.put(`/ventanas/${id}`, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ventanas'] })
      qc.invalidateQueries({ queryKey: ['ventanas', id] })
      toast.success('Listero actualizado')
      safeBack('/admin/ventanas')
    },
    onError: (e: ApiErrorClass) => {
      if (!e?.details?.length) toast.error(e?.message || 'No fue posible actualizar el listero')
    },
  })

  // Normalizador único para request
  const toPayload = (v: VentanaFormValues) => ({
    bancaId: v.bancaId,
    name: (v.name ?? '').trim(),
    code: v.code?.trim() || undefined,
    email: v.email?.trim() || undefined,
    phone: v.phone?.trim() || undefined,
    address: v.address?.trim() || undefined,
    commissionMarginX:
      v.commissionMarginX == null ? null : Number(v.commissionMarginX),
    isActive: !!v.isActive,
  })

  // Deriva initialValues desde el recurso y crea initialPayload memoizado
  const initialValues = useMemo(() => {
    if (!ventana) return undefined
    return {
      bancaId: ventana.bancaId ?? '',
      name: ventana.name ?? '',
      code: ventana.code ?? '',
      email: ventana.email ?? '',
      phone: ventana.phone ?? '',
      address: ventana.address ?? '',
      commissionMarginX: ventana.commissionMarginX ?? null,
      isActive: !!ventana.isActive,
    } as VentanaFormValues
  }, [ventana])

  const initialPayload = useMemo(
    () => (initialValues ? toPayload(initialValues) : undefined),
    [initialValues]
  )

  const handleSubmit = async (values: VentanaFormValues) => {
    const payload = toPayload(values)

    // Evita request si no hubo cambios
    if (initialPayload && !isDirtyUtil(payload, initialPayload)) {
      toast.info('No hay cambios para guardar')
      return
    }

    await updateMutation.mutateAsync(payload)
  }

  return (
    <ScrollView flex={1} backgroundColor="$background">
      <YStack padding="$4" gap="$4" maxWidth={720} alignSelf="center" width="100%">
        <XStack ai="center" gap="$2">
          <Button
            size="$3"
            icon={(p:any)=> <ArrowLeft {...p} size={24} color={iconColor} />}
            onPress={() => router.push('/admin/ventanas')}
            backgroundColor="transparent"
            borderWidth={0}
            hoverStyle={{ backgroundColor: 'transparent' }}
            pressStyle={{ scale: 0.98 }}
          />
          <Text fontSize="$8" fontWeight="bold" color="$color">Editar Listero</Text>
        </XStack>

        {!ventana || loadingVentana ? (
          <Text>Cargando…</Text>
        ) : (
          <VentanaForm
            initialValues={{
              bancaId: ventana.bancaId ?? '',
              name: ventana.name ?? '',
              code: ventana.code ?? '',
              email: ventana.email ?? '',
              phone: ventana.phone ?? '',
              address: ventana.address ?? '',
              commissionMarginX: ventana.commissionMarginX ?? null,
              isActive: !!ventana.isActive,
            }}
            onSubmit={handleSubmit}
            submitting={updateMutation.isPending}
            onCancel={() => safeBack('/admin/ventanas')}
            bancas={bancas}
            loadingBancas={loadingBancas}
            errorBancas={errorBancas}
            onRetryBancas={() => { void refetch() }}
          />
        )}
      </YStack>
    </ScrollView>
  )
}
