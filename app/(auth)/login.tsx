// app/(auth)/login.tsx
import React, { useEffect, useState } from 'react'
import { useWindowDimensions } from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { YStack, XStack, Text, Spinner } from 'tamagui'
import { Input, Button } from '@/components/ui'
import { Image } from 'expo-image'
import { User, Lock, ArrowRight } from '@tamagui/lucide-icons'
import { z } from 'zod'
import { useAuthStore } from '../../store/auth.store'

const loginSchema = z.object({
  username: z.string().min(3, 'El usuario debe tener al menos 3 caracteres'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
})

export default function LoginScreen() {
  const router = useRouter()
  const { msg } = useLocalSearchParams<{ msg?: string }>()
  const { login } = useAuthStore()
  const { width: ww, height: wh } = useWindowDimensions()

  const isShort = wh < 700

  const baseW = Math.min(Math.max(ww * 0.7, 240), 560)      // 240–560 px
  const baseH = baseW / 2                                    // 2:1
  const maxH = Math.min(wh * 0.25, 180)                      // 25% de alto o 180px, lo menor
  const logoH = Math.min(baseH, maxH)
  const logoW = logoH * 2

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<{ username?: string; password?: string; general?: string }>({})

  // Mostrar mensaje que llega por redirect (sesión expirada, etc.)
  useEffect(() => {
    if (msg) setErrors((e) => ({ ...e, general: String(msg) }))
  }, [msg])

  const handleLogin = async () => {
    try {
      const validated = loginSchema.parse({ username, password })
      setErrors({})
      setLoading(true)

      await login(validated.username, validated.password)

      const currentUser = useAuthStore.getState().user
      if (currentUser?.role === 'ADMIN') router.replace('/admin')
      else if (currentUser?.role === 'VENTANA') router.replace('/ventana')
      else if (currentUser?.role === 'VENDEDOR') router.replace('/vendedor')
      else router.replace('/(dashboard)')
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        const fieldErrors: { username?: string; password?: string } = {}
        error.errors.forEach((err) => {
          if (err.path[0]) fieldErrors[err.path[0] as 'username' | 'password'] = err.message
        })
        setErrors(fieldErrors)
      } else {
        setErrors({ general: error?.message || 'Error al iniciar sesión. Verifica tus credenciales.' })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <YStack
      flex={1}
      backgroundColor="$background"
      // si hay altura, centramos; si no, alineamos arriba
      justifyContent={isShort ? 'flex-start' : 'center'}
      alignItems="center"
      padding="$6"
      // un poco de respiro arriba en pantallas bajas
      paddingTop={isShort ? '$6' : undefined}
    >
      {/* Logo */}
      <YStack
        width={logoW}
        height={logoH}
        alignSelf="center"
        borderRadius="$6"
        overflow="hidden"
        backgroundColor="$background"
        borderWidth={1}
        borderColor="$borderColor"
        marginBottom="$6"
      >
        <Image
          source={require('../../assets/logo.png')}
          style={{ width: '100%', height: '100%' }}
          // contiene sin recortar; siempre verás el logo completo
          contentFit="contain"
          contentPosition="center"
          transition={150}
          accessibilityLabel="Logo de la app"
        />
      </YStack>

      <Text fontSize="$9" fontWeight="700" color="$textPrimary" marginBottom="$2" textAlign="center">
        Bienvenido
      </Text>
      <Text fontSize="$5" color="$textSecondary" marginBottom="$2" textAlign="center">
        Ingresa tus credenciales para continuar
      </Text>

      {/* Error general */}
      {errors.general && (
        <YStack backgroundColor="$red2" padding="$3" borderRadius="$4" marginBottom="$4" width="100%" maxWidth={400}>
          <Text fontSize="$3" color="$red10" textAlign="center">
            {errors.general}
          </Text>
        </YStack>
      )}

      {/* Form */}
      <YStack width="100%" maxWidth={400} gap="$2">
        {/* Usuario */}
        <YStack gap="$2">
          <Text fontSize="$4" fontWeight="600" color="$textPrimary">Usuario</Text>
          <XStack
            backgroundColor="$backgroundHover"
            borderRadius="$4"
            borderWidth={1}
            borderColor={errors.username ? '$red10' : '$borderColor'}
            alignItems="center"
            paddingHorizontal="$4"
            minHeight={56}
          >
            <User size={20} color="$textTertiary" />
            <Input
              flex={1}
              value={username}
              onChangeText={setUsername}
              placeholder="Ingresa tu usuario"
              placeholderTextColor="$textTertiary"
              backgroundColor="transparent"
              borderWidth={0}
              height={48}
              fontSize="$4"
              color="$textPrimary"
              autoCapitalize="none"
            />
          </XStack>
          {errors.username && <Text fontSize="$3" color="$red10">{errors.username}</Text>}
        </YStack>

        {/* Contraseña */}
        <YStack gap="$2">
          <Text fontSize="$4" fontWeight="600" color="$textPrimary">Contraseña</Text>
          <XStack
            backgroundColor="$backgroundHover"
            borderRadius="$4"
            borderWidth={1}
            borderColor={errors.password ? '$red10' : '$borderColor'}
            alignItems="center"
            paddingHorizontal="$4"
            minHeight={56}
          >
            <Lock size={20} color="$textTertiary" />
            <Input
              flex={1}
              value={password}
              onChangeText={setPassword}
              placeholder="Ingresa tu contraseña"
              placeholderTextColor="$textTertiary"
              secureTextEntry
              backgroundColor="transparent"
              borderWidth={0}
              height={48}
              fontSize="$4"
              color="$textPrimary"
            />
          </XStack>
          {errors.password && <Text fontSize="$3" color="$red10">{errors.password}</Text>}
        </YStack>

        {/* Botón Login */}
        <Button
          backgroundColor="$primary"
          color="white"
          fontWeight="600"
          fontSize="$5"
          height={56}
          borderRadius="$4"
          onPress={handleLogin}
          disabled={loading}
          marginTop="$4"
          pressStyle={{ backgroundColor: '$primary', opacity: 0.8 }}
          hoverStyle={{ backgroundColor: '$primary', opacity: 0.9 }}
        >
          <XStack gap="$2" alignItems="center">
            {loading ? (
              <Spinner size="small" color="white" />
            ) : (
              <>
                <Text color="white" fontWeight="600" fontSize="$5">Iniciar Sesión</Text>
                <ArrowRight size={20} color="white" />
              </>
            )}
          </XStack>
        </Button>
      </YStack>

      <Text fontSize="$3" color="$textTertiary" marginTop="$6" textAlign="center">
        ¿Olvidaste tu contraseña?{' '}
        <Text color="$primary" fontWeight="600">Contacta al administrador</Text>
      </Text>
    </YStack>
  )
}
