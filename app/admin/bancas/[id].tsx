// app/admin/bancas/[id].tsx
import React from 'react'
import { ScrollView, Text, YStack, XStack } from 'tamagui'
import { Button } from '@/components/ui'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient, ApiErrorClass } from '@/lib/api.client'
import type { Banca } from '@/types/models.types'
import { useToast } from '@/hooks/useToast'
import { BancaForm, type BancaFormValues } from '../../../components/bancas/BancaForm'

export default function BancaDetailScreen() {
  const { id: rawId } = useLocalSearchParams<{ id?: string | string[] }>()
  const id = Array.isArray(rawId) ? rawId[0] : rawId
  const router = useRouter()
  const qc = useQueryClient()
  const toast = useToast()

  const { data, isLoading, isError } = useQuery({
    queryKey: ['bancas', 'detail', id],
    enabled: !!id,
    queryFn: async () => {
      const banca = await apiClient.get<Banca>(`/bancas/${id}`)
      return banca
    },
  })

  const updateMutation = useMutation({
    mutationFn: (payload: Partial<Banca>) => apiClient.put<Banca>(`/bancas/${id}`, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bancas'] })
      qc.invalidateQueries({ queryKey: ['bancas', 'detail', id] })
      toast.success('Cambios guardados')
      router.back()
    },
    onError: (error: ApiErrorClass) => {
      if (!error?.details?.length) {
        toast.error(error?.message || 'No fue posible guardar los cambios')
      }
    },
  })

  const handleSubmit = async (values: BancaFormValues) => {
    // Payload alineado a Create/UpdateBancaSchema
    const payload: Partial<Banca> = {
      name: values.name,
      code: values.code,
      email: values.email,
      address: values.address,
      phone: values.phone,
      isActive: values.isActive,
      defaultMinBet: values.defaultMinBet,
      globalMaxPerNumber: values.globalMaxPerNumber,
      salesCutoffMinutes: values.salesCutoffMinutes,
    }
    await updateMutation.mutateAsync(payload)
  }

  if (!id) {
    return (
      <YStack f={1} p="$4">
        <Text fontSize="$7" fontWeight="700">Banca no encontrada</Text>
        <Text color="$gray11">El identificador es inválido.</Text>
      </YStack>
    )
  }

  if (isLoading) {
    return (
      <YStack f={1} p="$4">
        <Text>Cargando banca…</Text>
      </YStack>
    )
  }

  if (isError || !data) {
    return (
      <YStack f={1} p="$4">
        <Text fontSize="$7" fontWeight="700">Error al cargar</Text>
        <Text color="$gray11">Intenta de nuevo más tarde.</Text>
        <XStack mt="$4">
          <Button onPress={() => router.back()}>Volver</Button>
        </XStack>
      </YStack>
    )
  }

  return (
    <ScrollView flex={1} backgroundColor={'$background'}>
      <YStack padding="$4" gap="$4" maxWidth={1200} alignSelf="center" width="100%">
        <Text fontSize="$8" fontWeight="bold">Editar Banca</Text>
        <BancaForm
          initial={data}
          onSubmit={handleSubmit}
          submitting={updateMutation.isPending}
          onCancel={() => router.back()}
        />
      </YStack>
    </ScrollView>
  )
}
