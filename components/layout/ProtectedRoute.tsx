import { ReactNode, useEffect } from 'react'
import { useRouter, useSegments } from 'expo-router'
import { useAuthStore } from '@/store/auth.store'
import { YStack, Spinner, Text } from 'tamagui'

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuthStore()
  const router = useRouter()
  const segments = useSegments()

  useEffect(() => {
    if (isLoading) return
    const inAuth = segments[0] === '(auth)'

    if (!user && !inAuth) {
      router.replace('/(auth)/login')
      return
    }
    if (user && inAuth) {
      // Por rol (si quieres):
      const targetByRole: Record<string, string> = {
        ADMIN: '/admin/bancas',
        VENTANA: '/ventana/ventas',
        VENDEDOR: '/vendedor/tickets',
      }
      router.replace(targetByRole[user.role] ?? '/(dashboard)')
    }
  }, [isLoading, user, segments, router])

  if (isLoading) {
    return (
      <YStack f={1} ai="center" jc="center" p="$4">
        <Spinner size="large" />
        <Text mt="$2" color="$secondary">Cargando…</Text>
      </YStack>
    )
  }

  return <>{children}</>
}
