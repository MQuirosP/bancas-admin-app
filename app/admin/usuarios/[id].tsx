// app/admin/usuarios/[id].tsx
import React, { useMemo } from 'react'
import { YStack, XStack, Text, ScrollView, Spinner, Button } from 'tamagui'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useUserQuery, useUpdateUser, useSoftDeleteUser, useRestoreUser } from '@/hooks/useUsers'
import UserForm, { UserFormValues } from '@/components/usuarios/UserForm'
import { useToast } from '@/hooks/useToast'
import { useVentanasInfinite } from '@/hooks/useVentanasInfinite'
import { getErrorMessage } from '../../../lib/errors'
import { safeBack } from '../../../lib/navigation'
import { safe } from '../../../utils/safe'

export default function UsuarioDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const toast = useToast()

  const { data, isLoading, isError } = useUserQuery(id)
  const updateUser = useUpdateUser(id!)
  const softDelete = useSoftDeleteUser()
  const restore = useRestoreUser()

  const {
    data: vData,
    isFetching: vFetching,
    isError: vError,
    refetch: vRefetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useVentanasInfinite('')

  const ventanas = useMemo(() => {
    const arr = (vData?.pages ?? []).flatMap(p => p.data ?? [])
      .filter(v => (v.isActive ?? true) === true)
    const map = new Map(arr.map(v => [v.id, v]))
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name, 'es'))
  }, [vData])

  const handleSubmit = async (values: UserFormValues) => {
    const [_, err] = await safe(updateUser.mutateAsync(values))
    if (err) return toast.error(getErrorMessage(err))
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
          onCancel={() => safeBack('/admin/usuarios')}
          onDelete={() => softDelete.mutate({ id })}
          onRestore={() => restore.mutate(id)}
          ventanas={ventanas}
          loadingVentanas={vFetching || isFetchingNextPage}
          errorVentanas={vError}
          onRetryVentanas={() => vRefetch()}
        />

        {hasNextPage && (
          <Button
            onPress={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            alignSelf="flex-start"
          >
            {isFetchingNextPage ? 'Cargando…' : 'Cargar más ventanas'}
          </Button>
        )}
      </YStack>
    </ScrollView>
  )
}
