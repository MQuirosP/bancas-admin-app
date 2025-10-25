// app/admin/bancas/nueva.tsx
import React from 'react'
import { YStack, Text, ScrollView } from 'tamagui'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient, ApiErrorClass } from '@/lib/api.client'
import type { Banca } from '@/types/models.types'
import { BancaForm, type BancaFormValues } from '@/components/bancas/BancaForm'
import { useToast } from '@/hooks/useToast'
import { safeBack, goToList } from '@/lib/navigation'

export default function NuevaBancaScreen() {
  const qc = useQueryClient()
  const toast = useToast()

  const createMutation = useMutation({
    mutationFn: (data: Partial<Banca>) => apiClient.post<Banca>('/bancas', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bancas'] })
      toast.success('Banca creada correctamente')
      goToList('/admin/bancas')
    },
    onError: (error: ApiErrorClass) => {
      if (!error?.details?.length) {
        toast.error(error?.message || 'No fue posible crear la banca')
      }
    },
  })

  const handleSubmit = async (values: BancaFormValues) => {
    // Payload alineado a CreateBancaSchema
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
    await createMutation.mutateAsync(payload)
  }

  return (
    <ScrollView flex={1} backgroundColor="$background">
      <YStack padding="$4" gap="$4" maxWidth={600} alignSelf="center" width="100%">
        <Text fontSize="$8" fontWeight="bold" color="$color">Nueva Banca</Text>
        <BancaForm
          onSubmit={handleSubmit}
          submitting={createMutation.isPending}
          onCancel={() => safeBack('/admin/bancas')}
        />
      </YStack>
    </ScrollView>
  )
}
