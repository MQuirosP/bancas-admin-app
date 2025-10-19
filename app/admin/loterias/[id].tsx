import React from 'react'
import { YStack, Text, ScrollView, Spinner } from 'tamagui'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useToast } from '@/hooks/useToast'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api.client'
import LoteriaForm from '../../../components/loterias/LoteriaForm'

export default function EditLoteriaScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const toast = useToast()
  const qc = useQueryClient()

  const { data, isLoading, isError } = useQuery({
    queryKey: ['loterias', 'detail', id],
    queryFn: async () => {
      const res = await apiClient.get<any>(`/loterias/${id}`)
      return Array.isArray(res) ? res[0] : res?.data ?? res
    }
  })

  const update = useMutation({
    mutationFn: (body: any) => apiClient.patch(`/loterias/${id}`, body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['loterias'] }); toast.success('Lotería actualizada'); router.replace('/admin/loterias') },
    onError: (e: any) => toast.error(e?.message || 'No fue posible actualizar'),
  })

  const goBackSafe = () => { /* @ts-ignore */
    if (typeof router.canGoBack === 'function' && router.canGoBack()) router.back()
    else router.replace('/admin/loterias')
  }

  if (isLoading) return <YStack f={1} ai="center" jc="center"><Spinner /></YStack>
  if (isError || !data) return <YStack f={1} ai="center" jc="center"><Text>No se pudo cargar</Text></YStack>

  return (
    <ScrollView flex={1} backgroundColor="$background">
      <YStack padding="$4" gap="$4" maxWidth={700} alignSelf="center" width="100%">
        <Text fontSize="$8" fontWeight="bold">Editar Lotería</Text>
        <LoteriaForm
          mode="edit"
          initial={data}
          submitting={update.isPending}
          onSubmit={(values) => update.mutate(values)}
          onCancel={goBackSafe}
        />
      </YStack>
    </ScrollView>
  )
}
