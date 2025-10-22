// app/admin/_layout.tsx
import React from 'react'
import { Stack, Redirect, router } from 'expo-router'
import { YStack, Text } from 'tamagui'
import { useAuthStore } from '../../store/auth.store'
import { setAuthExpiredHandler } from '../../lib/api.client'

export default function AdminLayout() {
  const { user, isAuthenticated, isHydrating, clearAuth } = useAuthStore()

  // Handler global para expiración durante la navegación
  React.useEffect(() => {
    setAuthExpiredHandler(async (msg: string) => {
      try { await clearAuth() } catch {}
      router.replace({ pathname: '/(auth)/login', params: { msg } })
    })
    return () => setAuthExpiredHandler(null)
  }, [clearAuth])

  // 1) Durante hidratación
  if (isHydrating) {
    return (
      <YStack f={1} ai="center" jc="center" bg="$background">
        <Text color="$gray11">Preparando sesión…</Text>
      </YStack>
    )
  }

  // 2) Sin sesión => fuera
  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login?msg=Inicia%20sesión%20para%20continuar." />
  }

  // 3) Si no es ADMIN, mándalo a su home real
  if (user?.role !== 'ADMIN') {
    const home = user?.role === 'VENTANA' ? '/ventana' : '/vendedor'
    return <Redirect href={home} />
  }

  // 4) Rol correcto => renderiza el Stack
  return (
    <YStack flex={1} backgroundColor="$background">
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="configuracion" />
        <Stack.Screen name="bancas/index" />
        <Stack.Screen name="bancas/[id]" />
        <Stack.Screen name="bancas/nueva" />
        <Stack.Screen name="loterias/index" />
        <Stack.Screen name="loterias/[id]" />
        <Stack.Screen name="loterias/nueva" />
        <Stack.Screen name="multipliers/index" />
        <Stack.Screen name="multipliers/[id]" />
        <Stack.Screen name="multipliers/nuevo" />
        <Stack.Screen name="reportes/index" />
        <Stack.Screen name="restrictions/index" />
        <Stack.Screen name="restrictions/[id]" />
        <Stack.Screen name="restrictions/nueva" />
        <Stack.Screen name="sorteos/index" />
        <Stack.Screen name="sorteos/[id]" />
        <Stack.Screen name="tickets/index" />
        <Stack.Screen name="usuarios/index" />
        <Stack.Screen name="usuarios/[id]" />
        <Stack.Screen name="usuarios/nuevo" />
        <Stack.Screen name="ventanas/index" />
        <Stack.Screen name="ventanas/[id]" />
        <Stack.Screen name="ventanas/nueva" />
      </Stack>
    </YStack>
  )
}
