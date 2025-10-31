// app/admin/multipliers/nuevo.tsx
import React from 'react'
import { YStack, XStack, Text, ScrollView, useTheme } from 'tamagui'
import { Button } from '@/components/ui'
import { ArrowLeft } from '@tamagui/lucide-icons'
import { useRouter } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api.client'
import type { Loteria } from '@/types/models.types'
import MultiplierForm from '@/components/multipliers/MultiplierForm'
import { useCreateMultiplier } from '@/hooks/useMultipliersCrud'
import { useToast } from '@/hooks/useToast'

export default function NuevoMultiplierScreen() {
  const router = useRouter()
  const theme = useTheme()
  const iconColor = (theme?.color as any)?.get?.() ?? '#000'
  const toast = useToast()
  const { data: lotData } = useQuery({
    queryKey: ['loterias', 'select'],
    queryFn: () => apiClient.get<{ data: Loteria[] }>('/loterias'),
  })
  const loterias = lotData?.data ?? []
  const create = useCreateMultiplier()

  return (
    <ScrollView flex={1} backgroundColor="$background">
      <YStack padding="$4" gap="$4" maxWidth={720} alignSelf="center" width="100%">
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
          <Text fontSize="$8" fontWeight="bold">Nuevo Multiplicador</Text>
        </XStack>
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
          }, { 
            onSuccess: () => {
              toast.success('Multiplicador creado exitosamente')
              router.back()
            }
          })}
          onCancel={() => router.back()}
        />
      </YStack>
    </ScrollView>
  )
}
