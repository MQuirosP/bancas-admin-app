// app/vendedor/configuracion/index.tsx
import React, { useState } from 'react'
import { ScrollView, YStack, XStack, Text, useTheme } from 'tamagui'
import { Button, Card } from '@/components/ui'
import { ArrowLeft, Settings, Printer, Lock, Palette } from '@tamagui/lucide-icons'
import { useRouter } from 'expo-router'
import { safeBack } from '@/lib/navigation'
import ChangePasswordForm, { ChangePasswordValues } from '@/components/auth/ChangePasswordForm'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api.client'
import { useToast } from '@/hooks/useToast'
import { getErrorMessage } from '@/lib/errors'
import { useAuthStore } from '@/store/auth.store'
import { useThemeStore } from '@/store/theme.store'
import { authService } from '@/services/auth.service'

export default function VendedorConfiguracionScreen() {
  const router = useRouter()
  const theme = useTheme()
  const iconColor = (theme?.color as any)?.get?.() ?? '#000'
  const toast = useToast()
  const qc = useQueryClient()
  const { user, setUser } = useAuthStore()
  const { theme: currentTheme } = useThemeStore()
  const [passwordOpen, setPasswordOpen] = useState(false)

  // Mutation para guardar el tema
  const themeMutation = useMutation({
    mutationFn: async (newTheme: 'light' | 'dark') => {
      if (!user?.id) return
      return apiClient.patch(`/users/${user.id}`, {
        settings: {
          theme: newTheme,
        },
      })
    },
    onSuccess: async () => {
      qc.invalidateQueries({ queryKey: ['auth', 'me'] })
      toast.success('Tema actualizado correctamente')
      // Actualizar el usuario en el store
      const meRes = await authService.me()
      if (meRes.success && meRes.data) {
        setUser(meRes.data)
      }
    },
    onError: (error: any) => {
      toast.error(getErrorMessage(error))
    },
  })

  const handleToggleTheme = async () => {
    const newTheme = currentTheme === 'light' ? 'dark' : 'light'
    // Cambiar el tema localmente primero para feedback inmediato
    useThemeStore.getState().toggleTheme()
    // Luego guardar en el backend
    themeMutation.mutate(newTheme)
  }

  // Mutation para cambiar contraseña
  const changePasswordMutation = useMutation({
    mutationFn: async (values: ChangePasswordValues) => {
      // Intentar usar el endpoint específico primero, si no existe, usar el genérico
      try {
        return await apiClient.put('/users/me/password', {
          currentPassword: values.currentPassword,
          newPassword: values.newPassword,
        })
      } catch (error: any) {
        // Fallback: usar el endpoint genérico si el específico no existe
        if (error?.response?.status === 404) {
          return await apiClient.patch(`/users/${user?.id}`, {
            password: values.newPassword,
          })
        }
        throw error
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['auth', 'me'] })
      toast.success('Contraseña actualizada correctamente')
      setPasswordOpen(false)
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'No se pudo cambiar la contraseña'
      toast.error(message)
    },
  })

  const handleChangePassword = async (values: ChangePasswordValues) => {
    await changePasswordMutation.mutateAsync(values)
  }

  return (
    <>
      <ScrollView flex={1} backgroundColor="$background">
        <YStack padding="$4" gap="$4" maxWidth={1200} alignSelf="center" width="100%">
          <XStack ai="center" gap="$2">
            <Button
              size="$3"
              icon={(p: any) => <ArrowLeft {...p} size={24} color={iconColor} />}
              onPress={() => safeBack('/vendedor')}
              backgroundColor="transparent"
              borderWidth={0}
              hoverStyle={{ backgroundColor: 'transparent' }}
              pressStyle={{ scale: 0.98 }}
            />
            <Settings size={24} color={iconColor} />
            <Text fontSize="$8" fontWeight="bold" color="$color">Configuración</Text>
          </XStack>

          <YStack gap="$4">
            <Text fontSize="$6" fontWeight="600" color="$textSecondary">
              Opciones de configuración disponibles
            </Text>

            {/* Statcard: Cambiar Contraseña */}
            <Card
              padding="$4"
              bg="$backgroundHover"
              borderColor="$borderColor"
              borderWidth={1}
            >
              <XStack ai="center" gap="$4" jc="space-between">
                <XStack ai="center" gap="$3" flex={1}>
                  <YStack
                    ai="center"
                    jc="center"
                    width={48}
                    height={48}
                    borderRadius="$4"
                    backgroundColor="$purple4"
                  >
                    <Lock size={24} color="$purple11" />
                  </YStack>
                  <YStack flex={1} gap="$1">
                    <Text fontSize="$5" fontWeight="600">
                      Cambiar Contraseña
                    </Text>
                    <Text fontSize="$3" color="$textSecondary">
                      Actualiza tu contraseña para mantener tu cuenta segura
                    </Text>
                  </YStack>
                </XStack>
                <Button
                  size="$3"
                  variant="outlined"
                  onPress={() => setPasswordOpen(true)}
                >
                  Cambiar
                </Button>
              </XStack>
            </Card>

            {/* Statcard: Cambiar Tema */}
            <Card
              padding="$4"
              bg="$backgroundHover"
              borderColor="$borderColor"
              borderWidth={1}
            >
              <XStack ai="center" gap="$4" jc="space-between">
                <XStack ai="center" gap="$3" flex={1}>
                  <YStack
                    ai="center"
                    jc="center"
                    width={48}
                    height={48}
                    borderRadius="$4"
                    backgroundColor="$orange4"
                  >
                    <Palette size={24} color="$orange11" />
                  </YStack>
                  <YStack flex={1} gap="$1">
                    <Text fontSize="$5" fontWeight="600">
                      Tema de la Aplicación
                    </Text>
                    <Text fontSize="$3" color="$textSecondary">
                      Actual: {currentTheme === 'light' ? 'Claro' : 'Oscuro'}
                    </Text>
                  </YStack>
                </XStack>
                <Button
                  size="$3"
                  variant="outlined"
                  onPress={handleToggleTheme}
                  disabled={themeMutation.isPending}
                  loading={themeMutation.isPending}
                >
                  Cambiar
                </Button>
              </XStack>
            </Card>

            {/* Statcard: Configuración de Impresión */}
            <Card
              padding="$4"
              bg="$backgroundHover"
              borderColor="$borderColor"
              borderWidth={1}
            >
              <XStack ai="center" gap="$4" jc="space-between">
                <XStack ai="center" gap="$3" flex={1}>
                  <YStack
                    ai="center"
                    jc="center"
                    width={48}
                    height={48}
                    borderRadius="$4"
                    backgroundColor="$blue4"
                  >
                    <Printer size={24} color="$blue11" />
                  </YStack>
                  <YStack flex={1} gap="$1">
                    <Text fontSize="$5" fontWeight="600">
                      Configuración de Impresión
                    </Text>
                    <Text fontSize="$3" color="$textSecondary">
                      Personaliza la apariencia de tus tiquetes impresos
                    </Text>
                  </YStack>
                </XStack>
                <Button
                  size="$3"
                  variant="outlined"
                  onPress={() => router.push('/vendedor/configuracion/impresion')}
                >
                  Configurar
                </Button>
              </XStack>
            </Card>
          </YStack>
        </YStack>
      </ScrollView>

      <ChangePasswordForm
        open={passwordOpen}
        onOpenChange={setPasswordOpen}
        onSubmit={handleChangePassword}
        loading={changePasswordMutation.isPending}
      />
    </>
  )
}

