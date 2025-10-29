// app/admin/multipliers/[id].tsx
import React from 'react'
import { YStack, XStack, Text, ScrollView, Spinner, useTheme } from 'tamagui'
import { Button } from '@/components/ui'
import { ArrowLeft } from '@tamagui/lucide-icons'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api.client'
import type { Loteria } from '@/types/models.types'
import MultiplierForm from '@/components/multipliers/MultiplierForm'
import { useMultiplierQuery, useUpdateMultiplier } from '@/hooks/useMultipliersCrud'

export default function MultiplierDetailScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>()
  const router = useRouter()
  const theme = useTheme()
  const iconColor = (theme?.color as any)?.get?.() ?? '#000'
  const { data: mData, isLoading, isError } = useMultiplierQuery(id)
  const { data: lotData } = useQuery({
    queryKey: ['loterias', 'select'],
    queryFn: () => apiClient.get<{ data: Loteria[] }>('/loterias'),
  })
  const update = useUpdateMultiplier(id!)

  if (!id) return <YStack f={1} p="$4"><Text>Multiplicador no encontrado</Text></YStack>
  if (isLoading) return <YStack f={1} p="$4"><Spinner /><Text>Cargando…</Text></YStack>
  if (isError || !mData) return <YStack f={1} p="$4"><Text>Error al cargar</Text></YStack>

  return (
    <ScrollView flex={1} backgroundColor="$background">
      <YStack padding="$4" gap="$4" maxWidth={700} alignSelf="center" width="100%">
        <XStack ai="center" gap="$2">
          <Button
            size="$3"
            icon={(p: any) => <ArrowLeft {...p} size={24} color={iconColor} />}
            onPress={() => router.push('/admin/multipliers')}
            backgroundColor="transparent"
            borderWidth={0}
            hoverStyle={{ backgroundColor: 'transparent' }}
            pressStyle={{ scale: 0.98 }}
          />
          <Text fontSize="$8" fontWeight="bold">Editar Multiplicador</Text>
        </XStack>
        <MultiplierForm
          mode="edit"
          initial={mData}
          loterias={lotData?.data ?? []}
          submitting={update.isPending}
          onSubmit={(v) => update.mutate({
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
