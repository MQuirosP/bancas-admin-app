import React from 'react'
import { YStack, Text, ScrollView } from 'tamagui'
import { useRouter } from 'expo-router'
import { useToast } from '@/hooks/useToast'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api.client'
import LoteriaForm from '../../../components/loterias/LoteriaForm'

export default function NuevaLoteriaScreen() {
  const router = useRouter()
  const toast = useToast()
  const qc = useQueryClient()

  const create = useMutation({
    mutationFn: (body: any) => apiClient.post('/loterias', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['loterias'] })
      toast.success('Lotería guardada')
      router.replace('/admin/loterias')
    },
    onError: (e: any) => toast.error(e?.message || 'No fue posible guardar'),
  })

  const goBackSafe = () => {
    // web puede no tener historial
    // @ts-ignore
    if (typeof router.canGoBack === 'function' && router.canGoBack()) router.back()
    else router.replace('/admin/loterias')
  }

  return (
    <ScrollView flex={1} backgroundColor="$background">
      <YStack padding="$4" gap="$4" maxWidth={700} alignSelf="center" width="100%">
        <Text fontSize="$8" fontWeight="bold">Nueva Lotería</Text>
        <LoteriaForm
          mode="create"
          submitting={create.isPending}
          onSubmit={(values) => create.mutate(values)}
          onCancel={goBackSafe}
        />
      </YStack>
    </ScrollView>
  )
}
