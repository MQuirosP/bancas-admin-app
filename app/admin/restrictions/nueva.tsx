// app/admin/restrictions/nueva.tsx
import React from 'react'
import { ScrollView, YStack, XStack, Text, useTheme } from 'tamagui'
import { useRouter } from 'expo-router'
import { Button } from '@/components/ui'
import { ArrowLeft } from '@tamagui/lucide-icons'
import RestrictionRulesForm from '@/components/restrictions/RestrictionRulesForm'
import { safeBack } from '@/lib/navigation'

export default function NuevaRestrictionScreen() {
  const theme = useTheme()
  const iconColor = (theme?.color as any)?.get?.() ?? '#000'
  const router = useRouter()

  return (
    <ScrollView flex={1} backgroundColor="$background">
      <YStack padding="$4" gap="$4" maxWidth={800} alignSelf="center" width="100%">
        <XStack ai="center" gap="$2">
          <Button
            size="$3"
            icon={(p:any)=> <ArrowLeft {...p} size={24} color={iconColor} />}
            onPress={() => safeBack('/admin/restrictions')}
            backgroundColor="transparent"
            borderWidth={0}
            hoverStyle={{ backgroundColor: 'transparent' }}
            pressStyle={{ scale: 0.98 }}
          />
          <Text fontSize="$8" fontWeight="bold">Nueva Restricción</Text>
        </XStack>
        <RestrictionRulesForm
          mode="create"
          onCancel={() => router.back()}
          onSuccess={() => router.replace('/admin/restrictions')}
        />
      </YStack>
    </ScrollView>
  )
}
