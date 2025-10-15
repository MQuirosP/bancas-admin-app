import React, { useState } from 'react';
import { YStack, Text, Button, Input, Card } from 'tamagui';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/auth.store';
import { apiClient, ApiErrorClass } from '@/lib/api.client';
import { LoginResponse } from '@/types/auth.types';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { setAuth } = useAuthStore();
  const router = useRouter();

  const handleLogin = async () => {
    setError('');
    setLoading(true);

    try {
      const response = await apiClient.post<LoginResponse>('/auth/login', {
        email,
        password,
      });

      await setAuth(response.user, response.token);
      router.replace('/');
    } catch (err) {
      if (err instanceof ApiErrorClass) {
        setError(err.message);
      } else {
        setError('Error al iniciar sesión');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <YStack flex={1} alignItems="center" justifyContent="center" padding="$4" backgroundColor="$background">
      <Card width={400} maxWidth="100%" padding="$6" elevation={4}>
        <YStack gap="$4">
          <Text fontSize="$8" fontWeight="bold" textAlign="center" color="$color">
            Iniciar Sesión
          </Text>

          <Text fontSize="$4" color="$secondary" textAlign="center">
            Administración de Bancas
          </Text>

          {error ? (
            <Card padding="$3" backgroundColor="$red2" borderWidth={1} borderColor="$red8">
              <Text color="$red10" fontSize="$3" textAlign="center">
                {error}
              </Text>
            </Card>
          ) : null}

          <YStack gap="$2">
            <Text fontSize="$3" fontWeight="500">Email</Text>
            <Input
              size="$4"
              placeholder="correo@ejemplo.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
          </YStack>

          <YStack gap="$2">
            <Text fontSize="$3" fontWeight="500">Contraseña</Text>
            <Input
              size="$4"
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="password"
            />
          </YStack>

          <Button
            size="$5"
            theme="active"
            onPress={handleLogin}
            disabled={loading || !email || !password}
            marginTop="$2"
          >
            {loading ? 'Iniciando...' : 'Ingresar'}
          </Button>
        </YStack>
      </Card>
    </YStack>
  );
}