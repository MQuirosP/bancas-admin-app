// app/admin/usuarios/[id].tsx
import React from 'react'
import { YStack, XStack, Text, ScrollView, Spinner } from 'tamagui'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useUserQuery, useUpdateUser, useSoftDeleteUser, useRestoreUser } from '@/hooks/useUsers'
import { UserForm, type UserFormValues } from '@/components/usuarios/UserForm'
import { useToast } from '@/hooks/useToast'

export default function UsuarioDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const toast = useToast()

  const { data, isLoading, isError } = useUserQuery(id)
  const updateUser = useUpdateUser(id!)
  const softDelete = useSoftDeleteUser()
  const restore = useRestoreUser()

  const handleSubmit = async (values: UserFormValues) => {
    await updateUser.mutateAsync(values)
    toast.success('Usuario guardado')
    router.replace('/admin/usuarios')
  }

  if (!id) {
    return (
      <YStack f={1} p="$4">
        <Text fontSize="$7" fontWeight="700">Usuario no encontrado</Text>
        <Text color="$textSecondary">El identificador es inválido.</Text>
      </YStack>
    )
  }

  if (isLoading) {
    return (
      <YStack f={1} p="$4">
        <XStack ai="center" gap="$2">
          <Spinner />
          <Text>Cargando usuario…</Text>
        </XStack>
      </YStack>
    )
  }

  if (isError || !data) {
    return (
      <YStack f={1} p="$4">
        <Text fontSize="$7" fontWeight="700">Error al cargar</Text>
        <Text color="$textSecondary">Intenta de nuevo más tarde.</Text>
      </YStack>
    )
  }

  return (
    <ScrollView flex={1} backgroundColor={'$background'}>
      <YStack padding="$4" gap="$4" maxWidth={700} alignSelf="center" width="100%">
        <Text fontSize="$8" fontWeight="bold">Editar Usuario</Text>
        <UserForm
          mode="edit"
          initial={data}
          onSubmit={handleSubmit}
          onCancel={() => router.back()}
          onDelete={() => softDelete.mutate({ id })}
          onRestore={() => restore.mutate(id)}
        />
      </YStack>
    </ScrollView>
  )
}
