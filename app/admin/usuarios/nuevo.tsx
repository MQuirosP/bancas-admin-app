import React from 'react'
import { YStack, Text, ScrollView } from 'tamagui'
import { useCreateUser } from '@/hooks/useUsers'
import { useToast } from '@/hooks/useToast'
import { UserForm, type UserFormValues } from '@/components/usuarios/UserForm'
import { safeBack, goToList } from '@/lib/navigation'

export default function NuevoUsuarioScreen() {
  const toast = useToast()
  const createUser = useCreateUser()

  const handleSubmit = async (values: UserFormValues) => {
    await createUser.mutateAsync(values as any)
    toast.success('Usuario guardado')
    goToList('/admin/usuarios')
  }

  return (
    <ScrollView flex={1} backgroundColor="$background">
      <YStack padding="$4" gap="$4" maxWidth={700} alignSelf="center" width="100%">
        <Text fontSize="$8" fontWeight="bold">Nuevo Usuario</Text>
        <UserForm
          mode="create"
          onSubmit={handleSubmit}
          onCancel={() => safeBack('/admin/usuarios')}
        />
      </YStack>
    </ScrollView>
  )
}
