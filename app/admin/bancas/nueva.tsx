// app/admin/bancas/nueva.tsx
import React from 'react'
import { YStack, Text, ScrollView, XStack, useTheme } from 'tamagui'
import { Button } from '@/components/ui'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient, ApiErrorClass } from '@/lib/api.client'
import type { Banca } from '@/types/models.types'
import { BancaForm, type BancaFormValues } from '@/components/bancas/BancaForm'
import { useToast } from '@/hooks/useToast'
import { safeBack, goToList } from '@/lib/navigation'
import { useRouter } from 'expo-router'
import { ArrowLeft } from '@tamagui/lucide-icons'

export default function NuevaBancaScreen() {
  const router = useRouter()
  const qc = useQueryClient()
  const toast = useToast()
  const theme = useTheme()
  const iconColor = (theme?.color as any)?.get?.() ?? '#000'

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
      <YStack padding="$4" gap="$4" maxWidth={720} alignSelf="center" width="100%">
        <XStack ai="center" gap="$2">
          <Button
            size="$3"
            icon={(p:any)=> <ArrowLeft {...p} size={24} color={iconColor} />}
            onPress={() => router.push('/admin/bancas')}
            backgroundColor="transparent"
            borderWidth={0}
            hoverStyle={{ backgroundColor: 'transparent' }}
            pressStyle={{ scale: 0.98 }}
          />
          <Text fontSize="$8" fontWeight="bold" color="$color">Nueva Banca</Text>
        </XStack>
        <BancaForm
          onSubmit={handleSubmit}
          submitting={createMutation.isPending}
          onCancel={() => safeBack('/admin/bancas')}
        />
      </YStack>
    </ScrollView>
  )
}
