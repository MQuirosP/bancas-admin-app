import React, { useState } from 'react';
import { YStack, Text, Switch, ScrollView, XStack } from 'tamagui';
import { Button, Input, Card } from '@/components/ui';
import { useRouter } from 'expo-router'
import { useTheme } from 'tamagui'
import { ArrowLeft, Lock, Palette, Settings } from '@tamagui/lucide-icons'
import { safeBack } from '@/lib/navigation'
import ChangePasswordForm, { ChangePasswordValues } from '@/components/auth/ChangePasswordForm'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api.client'
import { useToast } from '@/hooks/useToast'
import { getErrorMessage } from '@/lib/errors'
import { useAuthStore } from '@/store/auth.store'
import { useThemeStore } from '@/store/theme.store'
import { authService } from '@/services/auth.service'

export default function ConfiguracionScreen() {
  const [defaultCutoff, setDefaultCutoff] = useState('5');
  const [enableDebug, setEnableDebug] = useState(false);
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
      try {
        return await apiClient.put('/users/me/password', {
          currentPassword: values.currentPassword,
          newPassword: values.newPassword,
        })
      } catch (error: any) {
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
              icon={(p:any)=> <ArrowLeft {...p} size={24} color={iconColor} />}
              onPress={()=> safeBack('/admin/dashboard')}
              backgroundColor="transparent"
              borderWidth={0}
              hoverStyle={{ backgroundColor: 'transparent' }}
              pressStyle={{ scale: 0.98 }}
            />
            <Settings size={24} color={iconColor} />
            <Text fontSize="$8" fontWeight="bold" color="$color">
              Configuración
            </Text>
          </XStack>

          <YStack gap="$4">
            <Text fontSize="$6" fontWeight="600" color="$textSecondary">
              Configuración Personal
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

            <Text fontSize="$6" fontWeight="600" color="$textSecondary" mt="$4">
              Configuración Global del Sistema
            </Text>

            <Card padding="$4">
              <YStack gap="$4">
                <Text fontSize="$5" fontWeight="600">
                  Parámetros del Sistema
                </Text>

                <YStack gap="$2">
                  <Text fontSize="$4" fontWeight="500">
                    Cutoff Predeterminado (minutos)
                  </Text>
                  <Input
                    size="$4"
                    value={defaultCutoff}
                    onChangeText={setDefaultCutoff}
                    keyboardType="number-pad"
                  />
                  <Text fontSize="$2" color="$textSecondary">
                    Aplica cuando no hay reglas específicas
                  </Text>
                </YStack>

                <XStack gap="$3" alignItems="center" mt="$2">
                  <Switch
                    size="$2"
                    checked={enableDebug}
                    onCheckedChange={(v) => setEnableDebug(!!v)}
                    // visibles en web:
                    bw={1}
                    bc="$borderColor"
                    bg={enableDebug ? '$color10' : '$background'}
                    hoverStyle={{ bg: enableDebug ? '$color10' : '$backgroundHover' }}
                    // (opcional) accesibilidad
                    aria-label="Panel de Debug"
                    focusStyle={{ outlineWidth: 2, outlineStyle: 'solid', outlineColor: 'var(--color10)' }}
                  >
                    <Switch.Thumb animation="quick" bg="$color12" />
                  </Switch>

                  <YStack flex={1} gap="$1">
                    <Text fontSize="$4">Panel de Debug</Text>
                    <Text fontSize="$2" color="$textSecondary">
                      Mostrar información de depuración en errores
                    </Text>
                  </YStack>
                </XStack>

                <Button variant="primary" marginTop="$3">
                  Guardar Configuración
                </Button>
              </YStack>
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
  );
}
