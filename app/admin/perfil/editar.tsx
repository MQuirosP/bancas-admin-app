// app/admin/perfil/editar.tsx
import React, { useState, useEffect } from 'react';
import { YStack, XStack, Text, Button, Input, Card, ScrollView, Spinner } from 'tamagui';
import { useRouter } from 'expo-router';
import { User, Mail, AlertCircle, CheckCircle } from '@tamagui/lucide-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../../lib/api.client';
import { useAuthStore } from '../../../store/auth.store';

interface UpdateProfileRequest {
  name: string;
  email?: string;
}

export default function EditarPerfilScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, setUser } = useAuthStore();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);

  // Cargar datos actuales del usuario
  const { data: currentUser, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: () => apiClient.get('/auth/me'),
    onSuccess: (data: any) => {
      setName(data.name || '');
      setEmail(data.email || '');
    },
  });

  // Inicializar con datos del store si existen
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
    }
  }, [user]);

  const updateProfileMutation = useMutation({
    mutationFn: (data: UpdateProfileRequest) => 
      apiClient.patch('/auth/profile', data),
    onSuccess: (data: any) => {
      setSuccess(true);
      setErrors({});
      
      // Actualizar el usuario en el store
      if (data) {
        setUser(data);
      }
      
      // Invalidar query
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      
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
        setErrors({ general: error.message || 'Error al actualizar el perfil' });
      }
    },
  });

  const validateAndSubmit = () => {
    setErrors({});
    setSuccess(false);

    const newErrors: Record<string, string> = {};

    if (!name || name.trim().length < 2) {
      newErrors.name = 'El nombre debe tener al menos 2 caracteres';
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Ingresa un correo electrónico válido';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    updateProfileMutation.mutate({
      name: name.trim(),
      email: email.trim() || undefined,
    });
  };

  if (isLoading) {
    return (
      <YStack flex={1} backgroundColor="$background" alignItems="center" justifyContent="center">
        <Spinner size="large" />
        <Text marginTop="$3" color="$textSecondary">
          Cargando información...
        </Text>
      </YStack>
    );
  }

  return (
    <ScrollView flex={1} backgroundColor="$background">
      <YStack padding="$4" gap="$4" maxWidth={600} alignSelf="center" width="100%">
        {/* Header */}
        <YStack gap="$2">
          <Text fontSize="$8" fontWeight="bold" color="$textPrimary">
            Información Personal
          </Text>
          <Text fontSize="$4" color="$textSecondary">
            Actualiza tus datos personales
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
                ¡Perfil actualizado exitosamente! Redirigiendo...
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

        {/* User Info Card */}
        <Card padding="$4" backgroundColor="$blue2" borderWidth={1} borderColor="$blue8">
          <YStack gap="$2">
            <Text fontSize="$3" fontWeight="600" color="$blue11">
              Información de la Cuenta
            </Text>
            <XStack gap="$2" alignItems="center">
              <Text fontSize="$3" color="$blue11">
                Usuario:
              </Text>
              <Text fontSize="$3" fontWeight="600" color="$blue11">
                {user?.username}
              </Text>
            </XStack>
            <XStack gap="$2" alignItems="center">
              <Text fontSize="$3" color="$blue11">
                Rol:
              </Text>
              <Text fontSize="$3" fontWeight="600" color="$blue11">
                {user?.role}
              </Text>
            </XStack>
          </YStack>
        </Card>

        {/* Form */}
        <Card padding="$4">
          <YStack gap="$4">
            {/* Nombre */}
            <YStack gap="$2">
              <Text fontSize="$4" fontWeight="500" color="$textPrimary">
                Nombre Completo *
              </Text>
              <XStack
                backgroundColor="$backgroundHover"
                borderRadius="$4"
                borderWidth={1}
                borderColor={errors.name ? '$red10' : '$borderColor'}
                alignItems="center"
                paddingHorizontal="$4"
                minHeight={56}
              >
                <User size={20} color="$textTertiary" />
                <Input
                  flex={1}
                  value={name}
                  onChangeText={setName}
                  placeholder="Ingresa tu nombre completo"
                  placeholderTextColor="$textTertiary"
                  backgroundColor="transparent"
                  borderWidth={0}
                  height={48}
                  fontSize="$4"
                  color="$textPrimary"
                />
              </XStack>
              {errors.name && (
                <Text fontSize="$3" color="$red10">
                  {errors.name}
                </Text>
              )}
            </YStack>

            {/* Email */}
            <YStack gap="$2">
              <Text fontSize="$4" fontWeight="500" color="$textPrimary">
                Correo Electrónico
              </Text>
              <XStack
                backgroundColor="$backgroundHover"
                borderRadius="$4"
                borderWidth={1}
                borderColor={errors.email ? '$red10' : '$borderColor'}
                alignItems="center"
                paddingHorizontal="$4"
                minHeight={56}
              >
                <Mail size={20} color="$textTertiary" />
                <Input
                  flex={1}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="correo@ejemplo.com"
                  placeholderTextColor="$textTertiary"
                  backgroundColor="transparent"
                  borderWidth={0}
                  height={48}
                  fontSize="$4"
                  color="$textPrimary"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </XStack>
              {errors.email && (
                <Text fontSize="$3" color="$red10">
                  {errors.email}
                </Text>
              )}
              <Text fontSize="$2" color="$textTertiary">
                Opcional - Para recuperación de contraseña
              </Text>
            </YStack>
          </YStack>
        </Card>

        {/* Actions */}
        <XStack gap="$3">
          <Button
            flex={1}
            theme="red"
            onPress={() => router.back()}
            disabled={updateProfileMutation.isPending}
          >
            Cancelar
          </Button>
          <Button
            flex={1}
            theme="blue"
            onPress={validateAndSubmit}
            disabled={updateProfileMutation.isPending || success}
          >
            {updateProfileMutation.isPending ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </XStack>
      </YStack>
    </ScrollView>
  );
}