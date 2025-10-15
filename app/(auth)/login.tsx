// app/(auth)/login.tsx
import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { YStack, XStack, Text, Input, Button, Spinner } from 'tamagui';
import { User, Lock, LogIn } from '@tamagui/lucide-icons';
import { useAuthStore } from '@/store/auth.store';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// Schema de validación con username
const loginSchema = z.object({
  username: z
    .string()
    .min(3, 'El usuario debe tener al menos 3 caracteres')
    .max(50, 'El usuario no puede exceder 50 caracteres'),
  password: z
    .string()
    .min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      await login(data.username, data.password);
      router.replace('/(dashboard)');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Usuario o contraseña incorrectos'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <YStack
      flex={1}
      backgroundColor="$background"
      justifyContent="center"
      alignItems="center"
      padding="$4"
    >
      <YStack
        width="100%"
        maxWidth={400}
        gap="$4"
        backgroundColor="$backgroundStrong"
        padding="$6"
        borderRadius="$6"
        borderWidth={1}
        borderColor="$borderColor"
        shadowColor="$shadowColor"
        shadowOffset={{ width: 0, height: 4 }}
        shadowOpacity={0.1}
        shadowRadius={12}
      >
        {/* Header */}
        <YStack gap="$2" alignItems="center" marginBottom="$4">
          <YStack
            width={64}
            height={64}
            backgroundColor="$blue10"
            borderRadius="$4"
            alignItems="center"
            justifyContent="center"
          >
            <LogIn size={32} color="white" />
          </YStack>
          <Text fontSize="$8" fontWeight="700" color="$color">
            Bienvenido
          </Text>
          <Text fontSize="$4" color="$colorTranslucent" textAlign="center">
            Ingresa tus credenciales para continuar
          </Text>
        </YStack>

        {/* Error Message */}
        {error && (
          <YStack
            backgroundColor="$red2"
            borderWidth={1}
            borderColor="$red6"
            padding="$3"
            borderRadius="$3"
          >
            <Text fontSize="$3" color="$red11" textAlign="center">
              {error}
            </Text>
          </YStack>
        )}

        {/* Username Input */}
        <YStack gap="$2">
          <Text fontSize="$3" fontWeight="600" color="$color">
            Usuario
          </Text>
          <Controller
            control={control}
            name="username"
            render={({ field: { onChange, onBlur, value } }) => (
              <XStack
                alignItems="center"
                gap="$2"
                backgroundColor="$background"
                borderWidth={1}
                borderColor={errors.username ? '$red8' : '$borderColor'}
                borderRadius="$3"
                paddingHorizontal="$3"
                paddingVertical="$2"
                focusStyle={{
                  borderColor: '$blue9',
                }}
              >
                <User size={20} color="$colorTranslucent" />
                <Input
                  flex={1}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder="Ingresa tu usuario"
                  placeholderTextColor="$colorTranslucent"
                  autoCapitalize="none"
                  autoCorrect={false}
                  borderWidth={0}
                  backgroundColor="transparent"
                  focusStyle={{
                    borderWidth: 0,
                  }}
                />
              </XStack>
            )}
          />
          {errors.username && (
            <Text fontSize="$2" color="$red11">
              {errors.username.message}
            </Text>
          )}
        </YStack>

        {/* Password Input */}
        <YStack gap="$2">
          <Text fontSize="$3" fontWeight="600" color="$color">
            Contraseña
          </Text>
          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <XStack
                alignItems="center"
                gap="$2"
                backgroundColor="$background"
                borderWidth={1}
                borderColor={errors.password ? '$red8' : '$borderColor'}
                borderRadius="$3"
                paddingHorizontal="$3"
                paddingVertical="$2"
                focusStyle={{
                  borderColor: '$blue9',
                }}
              >
                <Lock size={20} color="$colorTranslucent" />
                <Input
                  flex={1}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder="Ingresa tu contraseña"
                  placeholderTextColor="$colorTranslucent"
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                  borderWidth={0}
                  backgroundColor="transparent"
                  focusStyle={{
                    borderWidth: 0,
                  }}
                />
              </XStack>
            )}
          />
          {errors.password && (
            <Text fontSize="$2" color="$red11">
              {errors.password.message}
            </Text>
          )}
        </YStack>

        {/* Login Button */}
        <Button
          size="$5"
          backgroundColor="$blue10"
          color="white"
          borderRadius="$3"
          fontWeight="700"
          marginTop="$2"
          disabled={isLoading}
          onPress={handleSubmit(onSubmit)}
          icon={isLoading ? <Spinner color="white" /> : <LogIn size={20} />}
          hoverStyle={{
            backgroundColor: '$blue11',
            scale: 1.02,
          }}
          pressStyle={{
            backgroundColor: '$blue9',
            scale: 0.98,
          }}
        >
          {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
        </Button>
      </YStack>
    </YStack>
  );
}