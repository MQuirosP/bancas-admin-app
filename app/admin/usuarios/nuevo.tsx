// app/admin/usuarios/nuevo.tsx
import React, { useMemo } from 'react'
import { YStack, Text, ScrollView } from 'tamagui'
import { Button } from '@/components/ui'
import { useCreateUser } from '@/hooks/useUsers'
import { useToast } from '@/hooks/useToast'
import { safeBack, goToList } from '@/lib/navigation'
import UserForm, { UserFormValues } from '@/components/usuarios/UserForm' // ✅ ruta absoluta correcta
import { useVentanasInfinite } from '@/hooks/useVentanasInfinite'
import { toCreateUserDTO } from '@/services/users.service'
import { getErrorMessage } from '../../../lib/errors'
import { safe } from '../../../utils/safe'

export default function NuevoUsuarioScreen() {
  const toast = useToast()
  const createUser = useCreateUser()

  // Ventanas para el Select (misma lógica que en [id].tsx)
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
  const [_, err] = await safe(createUser.mutateAsync(values as any))
  if (err) return toast.error(getErrorMessage(err))
  toast.success('Usuario guardado')
  goToList('/admin/usuarios')
}

  return (
    <ScrollView flex={1} backgroundColor="$background">
      <YStack padding="$4" gap="$4" maxWidth={1200} alignSelf="center" width="100%">
        <Text fontSize="$8" fontWeight="bold">Nuevo Usuario</Text>

        <UserForm
          mode="create"
          onSubmit={handleSubmit}
          onCancel={() => safeBack('/admin/usuarios')}
          // 👉 pasar ventanas al Select
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
