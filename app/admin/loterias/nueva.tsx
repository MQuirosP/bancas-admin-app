// app/admin/loterias/nueva.tsx
import React from 'react'
import { YStack, Text, ScrollView } from 'tamagui'
import { useToast } from '@/hooks/useToast'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient, ApiErrorClass } from '@/lib/api.client'
import LoteriaForm from '@/components/loterias/LoteriaForm'
import { safeBack, goToList } from '@/lib/navigation'

export default function NuevaLoteriaScreen() {
  const toast = useToast()
  const qc = useQueryClient()

  const create = useMutation({
    mutationFn: (body: any) => apiClient.post('/loterias', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['loterias'] })
      toast.success('Lotería guardada')
      goToList('/admin/loterias')
    },
    onError: (e: ApiErrorClass) => toast.error(e?.message || 'No fue posible guardar'),
  })

  return (
    <ScrollView flex={1} backgroundColor="$background">
      <YStack padding="$4" gap="$4" maxWidth={700} alignSelf="center" width="100%">
        <Text fontSize="$8" fontWeight="bold">Nueva Lotería</Text>
        <LoteriaForm
          mode="create"
          submitting={create.isPending}
          onSubmit={(values) => create.mutate(values)}
          onCancel={() => safeBack('/admin/loterias')}
        />
      </YStack>
    </ScrollView>
  )
}
