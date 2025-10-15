import React, { useEffect } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { useAuthStore } from '@/store/auth.store';
import { UserRole } from '@/types/auth.types';
import { YStack, Text, Spinner } from 'tamagui';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { isAuthenticated, isLoading, user } = useAuthStore();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/login');
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/');
    }

    // Check role permissions
    if (isAuthenticated && allowedRoles && user) {
      if (!allowedRoles.includes(user.role)) {
        router.replace('/');
      }
    }
  }, [isAuthenticated, isLoading, segments, user, allowedRoles]);

  if (isLoading) {
    return (
      <YStack flex={1} alignItems="center" justifyContent="center" backgroundColor="$background">
        <Spinner size="large" color="$primary" />
        <Text marginTop="$4" color="$color">
          Cargando...
        </Text>
      </YStack>
    );
  }

  return <>{children}</>;
};