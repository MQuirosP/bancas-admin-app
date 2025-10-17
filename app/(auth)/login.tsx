// app/(auth)/login.tsx
import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { YStack, XStack, Text, Input, Button, Spinner } from 'tamagui';
import { Image } from 'expo-image';
import { User, Lock, ArrowRight } from '@tamagui/lucide-icons';
import { z } from 'zod';
import { useAuthStore } from '../../store/auth.store';

const loginSchema = z.object({
  username: z.string().min(3, 'El usuario debe tener al menos 3 caracteres'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

export default function LoginScreen() {
  const router = useRouter();
  const { login, user } = useAuthStore();
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ username?: string; password?: string; general?: string }>({});

  const handleLogin = async () => {
    try {
      // Validar campos
      const validated = loginSchema.parse({ username, password });
      setErrors({});
      
      setLoading(true);
      console.log('🔐 Iniciando login...');
      
      // Llamar a login del store
      await login(validated.username, validated.password);
      
      // Obtener el rol del usuario desde el store actualizado
      const currentUser = useAuthStore.getState().user;
      console.log('✅ Login exitoso, rol:', currentUser?.role);
      
      // Redirigir según el rol
      if (currentUser?.role === 'ADMIN') {
        console.log('📍 Redirigiendo a /admin');
        router.replace('/admin');
      } else if (currentUser?.role === 'VENTANA') {
        console.log('📍 Redirigiendo a /ventana');
        router.replace('/ventana');
      } else if (currentUser?.role === 'VENDEDOR') {
        console.log('📍 Redirigiendo a /vendedor');
        router.replace('/vendedor');
      } else {
        // Fallback al dashboard genérico
        console.log('📍 Redirigiendo a /(dashboard)');
        router.replace('/(dashboard)');
      }
      
    } catch (error: any) {
      console.error('❌ Error en login:', error);
      
      if (error instanceof z.ZodError) {
        const fieldErrors: { username?: string; password?: string } = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as 'username' | 'password'] = err.message;
          }
        });
        setErrors(fieldErrors);
      } else {
        // Error de autenticación del backend
        setErrors({
          general: error?.message || 'Error al iniciar sesión. Verifica tus credenciales.',
        });
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
      {/* Logo / Imagen */}
      <YStack
        width={128}
        height={128}
        $gtSm={{ width: 320, height: 160 }}
        alignItems="center"
        justifyContent="center"
        marginBottom="$6"
        borderRadius={24}
        overflow="hidden"
        backgroundColor="$background"
        borderWidth={1}
        borderColor="$borderColor"
      >
        <Image
          source={require('../../assets/logo.png')}
          style={{ width: '100%', height: '100%', borderRadius: 24 }}
          contentFit="cover"
          contentPosition="center"
          transition={150}
          accessibilityLabel="Logo de la app"
        />
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
        marginBottom="$2"
        textAlign="center"
      >
        Ingresa tus credenciales para continuar
      </Text>

      {/* Error general */}
      {errors.general && (
        <YStack
          backgroundColor="$red2"
          padding="$3"
          borderRadius="$4"
          marginBottom="$4"
          width="100%"
          maxWidth={400}
        >
          <Text fontSize="$3" color="$red10" textAlign="center">
            {errors.general}
          </Text>
        </YStack>
      )}

      {/* Formulario */}
      <YStack width="100%" maxWidth={400} gap="$2">
        {/* Campo Username */}
        <YStack gap="$2">
          <Text fontSize="$4" fontWeight="600" color="$textPrimary">
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
              autoCapitalize="none"
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
          <Text fontSize="$4" fontWeight="600" color="$textPrimary">
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