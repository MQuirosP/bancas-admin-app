// app/admin/perfil/cambiar-contrasena.tsx
import React, { useState } from 'react';
import { YStack, XStack, Text, Button, Input, Card, ScrollView } from 'tamagui';
import { useRouter } from 'expo-router';
import { Lock, Eye, EyeOff, AlertCircle, CheckCircle } from '@tamagui/lucide-icons';
import { useMutation } from '@tanstack/react-query';
import { apiClient } from '../../../lib/api.client';

interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function CambiarContrasenaScreen() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);

  const changePasswordMutation = useMutation({
    mutationFn: (data: ChangePasswordRequest) => 
      apiClient.post('/auth/change-password', data),
    onSuccess: () => {
      setSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setErrors({});
      
      // Volver después de 2 segundos
      setTimeout(() => {
        router.back();
      }, 2000);
    },
    onError: (error: any) => {
      if (error.details) {
        const fieldErrors: Record<string, string> = {};
        error.details.forEach((detail: any) => {
          if (detail.field) {
            fieldErrors[detail.field] = detail.message;
          }
        });
        setErrors(fieldErrors);
      } else {
        setErrors({ general: error.message || 'Error al cambiar la contraseña' });
      }
    },
  });

  const validateAndSubmit = () => {
    setErrors({});
    setSuccess(false);

    const newErrors: Record<string, string> = {};

    if (!currentPassword) {
      newErrors.currentPassword = 'Ingresa tu contraseña actual';
    }

    if (!newPassword) {
      newErrors.newPassword = 'Ingresa una nueva contraseña';
    } else if (newPassword.length < 6) {
      newErrors.newPassword = 'La contraseña debe tener al menos 6 caracteres';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Confirma tu nueva contraseña';
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
    }

    if (currentPassword && newPassword && currentPassword === newPassword) {
      newErrors.newPassword = 'La nueva contraseña debe ser diferente a la actual';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    changePasswordMutation.mutate({
      currentPassword,
      newPassword,
      confirmPassword,
    });
  };

  return (
    <ScrollView flex={1} backgroundColor="$background">
      <YStack padding="$4" gap="$4" maxWidth={600} alignSelf="center" width="100%">
        {/* Header */}
        <YStack gap="$2">
          <Text fontSize="$8" fontWeight="bold" color="$textPrimary">
            Cambiar Contraseña
          </Text>
          <Text fontSize="$4" color="$textSecondary">
            Actualiza tu contraseña de acceso
          </Text>
        </YStack>

        {/* Success Message */}
        {success && (
          <Card
            padding="$3"
            backgroundColor="$green2"
            borderWidth={1}
            borderColor="$green8"
          >
            <XStack gap="$2" alignItems="center">
              <CheckCircle size={20} color="$green10" />
              <Text color="$green10" fontSize="$3" flex={1}>
                ¡Contraseña cambiada exitosamente! Redirigiendo...
              </Text>
            </XStack>
          </Card>
        )}

        {/* General Error */}
        {errors.general && (
          <Card
            padding="$3"
            backgroundColor="$red2"
            borderWidth={1}
            borderColor="$red8"
          >
            <XStack gap="$2" alignItems="center">
              <AlertCircle size={20} color="$red10" />
              <Text color="$red10" fontSize="$3" flex={1}>
                {errors.general}
              </Text>
            </XStack>
          </Card>
        )}

        {/* Form */}
        <Card padding="$4">
          <YStack gap="$4">
            {/* Contraseña Actual */}
            <YStack gap="$2">
              <Text fontSize="$4" fontWeight="500" color="$textPrimary">
                Contraseña Actual *
              </Text>
              <XStack
                backgroundColor="$backgroundHover"
                borderRadius="$4"
                borderWidth={1}
                borderColor={errors.currentPassword ? '$red10' : '$borderColor'}
                alignItems="center"
                paddingHorizontal="$4"
                minHeight={56}
              >
                <Lock size={20} color="$textTertiary" />
                <Input
                  flex={1}
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  placeholder="Ingresa tu contraseña actual"
                  placeholderTextColor="$textTertiary"
                  secureTextEntry={!showCurrent}
                  backgroundColor="transparent"
                  borderWidth={0}
                  height={48}
                  fontSize="$4"
                  color="$textPrimary"
                />
                <Button
                  chromeless
                  size="$3"
                  onPress={() => setShowCurrent(!showCurrent)}
                  icon={showCurrent ? 
                    <EyeOff size={20} color="$textTertiary" /> : 
                    <Eye size={20} color="$textTertiary" />
                  }
                />
              </XStack>
              {errors.currentPassword && (
                <Text fontSize="$3" color="$red10">
                  {errors.currentPassword}
                </Text>
              )}
            </YStack>

            {/* Nueva Contraseña */}
            <YStack gap="$2">
              <Text fontSize="$4" fontWeight="500" color="$textPrimary">
                Nueva Contraseña *
              </Text>
              <XStack
                backgroundColor="$backgroundHover"
                borderRadius="$4"
                borderWidth={1}
                borderColor={errors.newPassword ? '$red10' : '$borderColor'}
                alignItems="center"
                paddingHorizontal="$4"
                minHeight={56}
              >
                <Lock size={20} color="$textTertiary" />
                <Input
                  flex={1}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="Ingresa tu nueva contraseña"
                  placeholderTextColor="$textTertiary"
                  secureTextEntry={!showNew}
                  backgroundColor="transparent"
                  borderWidth={0}
                  height={48}
                  fontSize="$4"
                  color="$textPrimary"
                />
                <Button
                  chromeless
                  size="$3"
                  onPress={() => setShowNew(!showNew)}
                  icon={showNew ? 
                    <EyeOff size={20} color="$textTertiary" /> : 
                    <Eye size={20} color="$textTertiary" />
                  }
                />
              </XStack>
              {errors.newPassword && (
                <Text fontSize="$3" color="$red10">
                  {errors.newPassword}
                </Text>
              )}
              <Text fontSize="$2" color="$textTertiary">
                Debe tener al menos 6 caracteres
              </Text>
            </YStack>

            {/* Confirmar Nueva Contraseña */}
            <YStack gap="$2">
              <Text fontSize="$4" fontWeight="500" color="$textPrimary">
                Confirmar Nueva Contraseña *
              </Text>
              <XStack
                backgroundColor="$backgroundHover"
                borderRadius="$4"
                borderWidth={1}
                borderColor={errors.confirmPassword ? '$red10' : '$borderColor'}
                alignItems="center"
                paddingHorizontal="$4"
                minHeight={56}
              >
                <Lock size={20} color="$textTertiary" />
                <Input
                  flex={1}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Confirma tu nueva contraseña"
                  placeholderTextColor="$textTertiary"
                  secureTextEntry={!showConfirm}
                  backgroundColor="transparent"
                  borderWidth={0}
                  height={48}
                  fontSize="$4"
                  color="$textPrimary"
                />
                <Button
                  chromeless
                  size="$3"
                  onPress={() => setShowConfirm(!showConfirm)}
                  icon={showConfirm ? 
                    <EyeOff size={20} color="$textTertiary" /> : 
                    <Eye size={20} color="$textTertiary" />
                  }
                />
              </XStack>
              {errors.confirmPassword && (
                <Text fontSize="$3" color="$red10">
                  {errors.confirmPassword}
                </Text>
              )}
            </YStack>
          </YStack>
        </Card>

        {/* Actions */}
        <XStack gap="$3">
          <Button
            flex={1}
            theme="red"
            onPress={() => router.back()}
            disabled={changePasswordMutation.isPending}
          >
            Cancelar
          </Button>
          <Button
            flex={1}
            theme="blue"
            onPress={validateAndSubmit}
            disabled={changePasswordMutation.isPending || success}
          >
            {changePasswordMutation.isPending ? 'Cambiando...' : 'Cambiar Contraseña'}
          </Button>
        </XStack>
      </YStack>
    </ScrollView>
  );
}