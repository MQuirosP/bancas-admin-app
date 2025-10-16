// app/(auth)/login.tsx
import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { YStack, XStack, Text, Input, Button, Spinner } from 'tamagui';
import { User, Lock, ArrowRight } from '@tamagui/lucide-icons';
import { z } from 'zod';
import { useAuthStore } from '../../store/auth.store';

const loginSchema = z.object({
  username: z.string().min(3, 'El usuario debe tener al menos 3 caracteres'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

export default function LoginScreen() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ username?: string; password?: string }>({});

  const handleLogin = async () => {
    try {
      // Validar campos
      const validated = loginSchema.parse({ username, password });
      setErrors({});
      
      setLoading(true);
      
      // Llamar a login del store
      await login(validated.username, validated.password);
      
      // Navegar al dashboard
      router.replace('/(dashboard)');
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: { username?: string; password?: string } = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as 'username' | 'password'] = err.message;
          }
        });
        setErrors(fieldErrors);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <YStack
      flex={1}
      backgroundColor="$background"
      justifyContent="center"
      alignItems="center"
      padding="$6"
    >
      {/* Logo / Icono */}
      <YStack
        width={80}
        height={80}
        backgroundColor="$primary"
        borderRadius="$6"
        alignItems="center"
        justifyContent="center"
        marginBottom="$6"
      >
        <Text fontSize={40} color="white">
          🎰
        </Text>
      </YStack>

      {/* Título */}
      <Text
        fontSize="$9"
        fontWeight="700"
        color="$textPrimary"
        marginBottom="$2"
        textAlign="center"
      >
        Bienvenido
      </Text>

      {/* Subtítulo */}
      <Text
        fontSize="$5"
        color="$textSecondary"
        marginBottom="$8"
        textAlign="center"
      >
        Ingresa tus credenciales para continuar
      </Text>

      {/* Formulario */}
      <YStack width="100%" maxWidth={400} gap="$5">
        {/* Campo Username */}
        <YStack gap="$2">
          <Text
            fontSize="$4"
            fontWeight="600"
            color="$textPrimary"
          >
            Usuario
          </Text>
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
            />
          </XStack>
          {errors.username && (
            <Text fontSize="$3" color="$red10">
              {errors.username}
            </Text>
          )}
        </YStack>

        {/* Campo Password */}
        <YStack gap="$2">
          <Text
            fontSize="$4"
            fontWeight="600"
            color="$textPrimary"
          >
            Contraseña
          </Text>
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
          {errors.password && (
            <Text fontSize="$3" color="$red10">
              {errors.password}
            </Text>
          )}
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
          pressStyle={{
            backgroundColor: '$primary',
            opacity: 0.8,
          }}
          hoverStyle={{
            backgroundColor: '$primary',
            opacity: 0.9,
          }}
        >
          <XStack gap="$2" alignItems="center">
            {loading ? (
              <Spinner size="small" color="white" />
            ) : (
              <>
                <Text color="white" fontWeight="600" fontSize="$5">
                  Iniciar Sesión
                </Text>
                <ArrowRight size={20} color="white" />
              </>
            )}
          </XStack>
        </Button>
      </YStack>

      {/* Link de ayuda */}
      <Text
        fontSize="$3"
        color="$textTertiary"
        marginTop="$6"
        textAlign="center"
      >
        ¿Olvidaste tu contraseña?{' '}
        <Text color="$primary" fontWeight="600">
          Contacta al administrador
        </Text>
      </Text>
    </YStack>
  );
}