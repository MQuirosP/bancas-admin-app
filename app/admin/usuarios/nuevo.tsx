// app/admin/usuarios/nuevo.tsx
import React from 'react'
import { YStack, Text, ScrollView } from 'tamagui'
import { useRouter } from 'expo-router'
import { useCreateUser } from '@/hooks/useUsers'
import { useToast } from '@/hooks/useToast'
import { UserForm, type UserFormValues } from '@/components/usuarios/UserForm'

export default function NuevoUsuarioScreen() {
  const router = useRouter()
  const toast = useToast()
  const createUser = useCreateUser()

  // Back seguro: si no hay historial (web), navega al índice
  const goBackSafe = () => {
    if (typeof router.canGoBack === 'function' && router.canGoBack()) {
      router.back()
    } else {
      router.replace('/admin/usuarios')
    }
  }

  const handleSubmit = async (values: UserFormValues) => {
    await createUser.mutateAsync(values as any)
    toast.success('Usuario guardado')
    router.replace('/admin/usuarios')
  }

  return (
    <ScrollView flex={1} backgroundColor={'$background'}>
      <YStack padding="$4" gap="$4" maxWidth={700} alignSelf="center" width="100%">
        <Text fontSize="$8" fontWeight="bold">Nuevo Usuario</Text>
        <UserForm
          mode="create"
          onSubmit={handleSubmit}
          onCancel={goBackSafe}   // 👈 usar back seguro
        />
      </YStack>
    </ScrollView>
  )
}
