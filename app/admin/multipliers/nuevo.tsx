// app/admin/multipliers/nuevo.tsx
import React from 'react'
import { YStack, Text, ScrollView } from 'tamagui'
import { useRouter } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api.client'
import type { Loteria } from '@/types/models.types'
import MultiplierForm from '@/components/multipliers/MultiplierForm'
import { useCreateMultiplier } from '@/hooks/useMultipliersCrud'

export default function NuevoMultiplierScreen() {
  const router = useRouter()
  const { data: lotData } = useQuery({
    queryKey: ['loterias', 'select'],
    queryFn: () => apiClient.get<{ data: Loteria[] }>('/loterias'),
  })
  const loterias = lotData?.data ?? []
  const create = useCreateMultiplier()

  return (
    <ScrollView flex={1} backgroundColor="$background">
      <YStack padding="$4" gap="$4" maxWidth={700} alignSelf="center" width="100%">
        <Text fontSize="$8" fontWeight="bold">Nuevo Multiplicador</Text>
        <MultiplierForm
          mode="create"
          loterias={loterias}
          submitting={create.isPending}
          onSubmit={(v) => create.mutate({
            loteriaId: v.loteriaId,
            name: v.name.trim(),
            valueX: parseFloat(v.valueX),
            kind: v.kind,
            isActive: v.isActive,
          }, { onSuccess: () => router.back() })}
          onCancel={() => router.back()}
        />
      </YStack>
    </ScrollView>
  )
}
