// app/admin/restrictions/nueva.tsx
import React from 'react'
import { ScrollView, YStack, Text } from 'tamagui'
import { useRouter } from 'expo-router'
import RestrictionRulesForm from '@/components/restrictions/RestrictionRulesForm'

export default function NuevaRestrictionScreen() {
  const router = useRouter()

  return (
    <ScrollView flex={1} backgroundColor="$background">
      <YStack padding="$4" gap="$4" maxWidth={800} alignSelf="center" width="100%">
        <Text fontSize="$8" fontWeight="bold">Nueva Restricción</Text>
        <RestrictionRulesForm
          mode="create"
          onCancel={() => router.back()}
          onSuccess={() => router.replace('/admin/restrictions')}
        />
      </YStack>
    </ScrollView>
  )
}
