// app/admin/loterias/nueva.tsx
import React, { useState } from 'react'
import { YStack, XStack, Text, ScrollView, useTheme } from 'tamagui'
import { Button } from '@/components/ui'
import { ArrowLeft } from '@tamagui/lucide-icons'
import { useRouter } from 'expo-router'
import { useToast } from '@/hooks/useToast'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient, ApiErrorClass } from '@/lib/api.client'
import LoteriaForm from '@/components/loterias/LoteriaForm'
import LoteriaRulesInline from '@/components/loterias/LoteriaRulesInline'
import { DEFAULT_RULES, LoteriaRulesJson } from '@/types/loteriaRules'
import { safeBack, goToList } from '@/lib/navigation'

export default function NuevaLoteriaScreen() {
  const router = useRouter()
  const toast = useToast()
  const qc = useQueryClient()
  const theme = useTheme()
  const iconColor = (theme?.color as any)?.get?.() ?? '#000'

  const [rules, setRules] = useState<LoteriaRulesJson>(DEFAULT_RULES)

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
      <YStack padding="$4" gap="$4" maxWidth={900} alignSelf="center" width="100%">
        <XStack ai="center" gap="$2">
          <Button
            size="$3"
            icon={(p: any) => <ArrowLeft {...p} size={24} color={iconColor} />}
            onPress={() => router.push('/admin/loterias')}
            backgroundColor="transparent"
            borderWidth={0}
            hoverStyle={{ backgroundColor: 'transparent' }}
            pressStyle={{ scale: 0.98 }}
          />
          <Text fontSize="$8" fontWeight="bold">Nueva Lotería</Text>
        </XStack>

        {/* Básicos */}
        <LoteriaForm
          mode="create"
          submitting={create.isPending}
          onSubmit={(values) => create.mutate({ ...values, rulesJson: rules })}
          onCancel={() => safeBack('/admin/loterias')}
        />

        {/* Reglas (inline, no llama API) */}
        <LoteriaRulesInline
          value={rules}
          onChange={setRules}
          submitLabel="Aplicar"
          persistHint="Se guardan junto con la lotería."
        />

      </YStack>
    </ScrollView>
  )
}
