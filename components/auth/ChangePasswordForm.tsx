// components/auth/ChangePasswordForm.tsx
import React, { useState } from 'react'
import { YStack, XStack, Text, Dialog, VisuallyHidden } from 'tamagui'
import { Button, Input } from '@/components/ui'
import { FieldGroup, FieldLabel, FieldError } from '@/components/ui/Field'
import { useToast } from '@/hooks/useToast'
import { z } from 'zod'
import { X } from '@tamagui/lucide-icons'
import DialogContentWrapper from '@/components/tickets/DialogContentWrapper'

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'La contraseña actual es requerida'),
  newPassword: z.string().min(8, 'La nueva contraseña debe tener al menos 8 caracteres'),
  confirmPassword: z.string().min(1, 'Confirma la nueva contraseña'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
}).refine((data) => data.currentPassword !== data.newPassword, {
  message: 'La nueva contraseña debe ser diferente a la actual',
  path: ['newPassword'],
})

export type ChangePasswordValues = z.infer<typeof changePasswordSchema>

interface ChangePasswordFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (values: ChangePasswordValues) => Promise<void>
  loading?: boolean
}

export default function ChangePasswordForm({
  open,
  onOpenChange,
  onSubmit,
  loading = false,
}: ChangePasswordFormProps) {
  const toast = useToast()
  const [values, setValues] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleSubmit = async () => {
    setErrors({})

    // Validar con schema
    const result = changePasswordSchema.safeParse(values)
    if (!result.success) {
      const fieldErrors: Record<string, string> = {}
      result.error.issues.forEach((issue) => {
        const path = issue.path[0]?.toString()
        if (path) {
          fieldErrors[path] = issue.message
        }
      })
      setErrors(fieldErrors)
      if (Object.keys(fieldErrors).length > 0) {
        toast.error('Revisa los campos marcados')
      }
      return
    }

    try {
      await onSubmit(result.data)
      // Limpiar formulario después de éxito
      setValues({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setErrors({})
      onOpenChange(false)
    } catch (error) {
      // El error ya se maneja en el componente padre
    }
  }

  const handleCancel = () => {
    setValues({ currentPassword: '', newPassword: '', confirmPassword: '' })
    setErrors({})
    onOpenChange(false)
  }

  return (
    <Dialog modal open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay
          key="change-password-overlay"
          animation="quick"
          opacity={0.5}
          enterStyle={{ opacity: 0 }}
          exitStyle={{ opacity: 0 }}
        />
        <DialogContentWrapper
          key="change-password-content"
          bordered
          elevate
          width="90%"
          maxWidth={500}
          padding="$4"
          gap="$4"
          backgroundColor="$background"
        >
          {/* Accessible Title */}
          <Dialog.Title asChild>
            <VisuallyHidden>
              <Text>Cambiar Contraseña</Text>
            </VisuallyHidden>
          </Dialog.Title>

          {/* Header */}
          <XStack jc="space-between" ai="center" gap="$2">
            <Text fontSize="$6" fontWeight="bold" color="$color">
              Cambiar Contraseña
            </Text>
            <Button
              size="$2"
              circular
              icon={X}
              backgroundColor="transparent"
              borderWidth={0}
              onPress={handleCancel}
              disabled={loading}
              hoverStyle={{ backgroundColor: '$backgroundHover' }}
            />
          </XStack>

          {/* Content */}
          <YStack gap="$3" flex={1} overflow="unset">
            <FieldGroup>
              <FieldLabel>Contraseña Actual</FieldLabel>
              <Input
                secureTextEntry
                placeholder="Ingresa tu contraseña actual"
                value={values.currentPassword}
                onChangeText={(text) =>
                  setValues((v) => ({ ...v, currentPassword: text }))
                }
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
              />
              {errors.currentPassword && (
                <FieldError>{errors.currentPassword}</FieldError>
              )}
            </FieldGroup>

            <FieldGroup>
              <FieldLabel>Nueva Contraseña</FieldLabel>
              <Input
                secureTextEntry
                placeholder="Mínimo 8 caracteres"
                value={values.newPassword}
                onChangeText={(text) =>
                  setValues((v) => ({ ...v, newPassword: text }))
                }
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
              />
              {errors.newPassword && (
                <FieldError>{errors.newPassword}</FieldError>
              )}
            </FieldGroup>

            <FieldGroup>
              <FieldLabel>Confirmar Nueva Contraseña</FieldLabel>
              <Input
                secureTextEntry
                placeholder="Confirma tu nueva contraseña"
                value={values.confirmPassword}
                onChangeText={(text) =>
                  setValues((v) => ({ ...v, confirmPassword: text }))
                }
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
              />
              {errors.confirmPassword && (
                <FieldError>{errors.confirmPassword}</FieldError>
              )}
            </FieldGroup>
          </YStack>

          {/* Actions */}
          <XStack gap="$2" jc="flex-end" flexWrap="wrap">
            <Button
              variant="outlined"
              onPress={handleCancel}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button onPress={handleSubmit} disabled={loading}>
              {loading ? 'Cambiando...' : 'Cambiar Contraseña'}
            </Button>
          </XStack>
        </DialogContentWrapper>
      </Dialog.Portal>
    </Dialog>
  )
}

