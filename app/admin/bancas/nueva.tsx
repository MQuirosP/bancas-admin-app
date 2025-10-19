// app/admin/bancas/nueva.tsx
import React from 'react'
import { YStack, Text, ScrollView } from 'tamagui'
import { useRouter } from 'expo-router'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient, ApiErrorClass } from '@/lib/api.client'
import type { Banca } from '@/types/models.types'
import { BancaForm, type BancaFormValues } from '../../../components/bancas/BancaForm'
import { useToast } from '@/hooks/useToast'

export default function NuevaBancaScreen() {
  const router = useRouter()
  const qc = useQueryClient()
  const toast = useToast()

  const createMutation = useMutation({
    mutationFn: (data: Partial<Banca>) => apiClient.post<Banca>('/bancas', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bancas'] })
      toast.success('Banca creada correctamente')
      router.back()
    },
    onError: (error: ApiErrorClass) => {
      // El form mapeará field errors; aquí solo un resumen si aplica
      if (!error?.details?.length) {
        toast.error(error?.message || 'No fue posible crear la banca')
      }
    },
  })

  const handleSubmit = async (values: BancaFormValues) => {
    // El schema ya normaliza tipos; mandamos tal cual
    const payload: Partial<Banca> = {
      name: values.name,
      code: values.code,
      isActive: values.isActive,
      salesCutoffMinutes: values.salesCutoffMinutes,
    }
    await createMutation.mutateAsync(payload)
  }

  return (
    <ScrollView flex={1} backgroundColor={'$background'}>
      <YStack padding="$4" gap="$4" maxWidth={600} alignSelf="center" width="100%">
        <Text fontSize="$8" fontWeight="bold" color="$color">Nueva Banca</Text>
        <BancaForm
          onSubmit={handleSubmit}
          submitting={createMutation.isPending}
          onCancel={() => router.back()}
        />
      </YStack>
    </ScrollView>
  )
}
