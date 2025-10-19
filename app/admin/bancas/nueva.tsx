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
    onSuccess: (res: any) => {
      qc.invalidateQueries({ queryKey: ['bancas'] })
      toast.success('Banca creada correctamente')
      // Navegación estandarizada al listado
      goToList('/admin/bancas')
    },
    onError: (error: ApiErrorClass) => {
      if (!error?.details?.length) {
        toast.error(error?.message || 'No fue posible crear la banca')
      }
    },
  })

  const handleSubmit = async (values: BancaFormValues) => {
    const payload: Partial<Banca> = {
      name: values.name,
      code: values.code,
      isActive: values.isActive,
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
          // Back seguro y consistente con el resto de módulos
          onCancel={() => safeBack('/admin/bancas')}
        />
      </YStack>
    </ScrollView>
  )
}
