import React from 'react';
import { YStack, XStack, Text, Card, ScrollView } from 'tamagui';
import { useAuthStore } from '@/store/auth.store';
import { UserRole } from '@/types/auth.types';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api.client';

export default function DashboardScreen() {
  const { user } = useAuthStore();

  const renderAdminDashboard = () => (
    <ScrollView>
      <YStack padding="$4" gap="$4">
        <Text fontSize="$8" fontWeight="bold" color="$color">
          Dashboard Administrador
        </Text>

        <XStack gap="$4" flexWrap="wrap">
          <Card flex={1} minWidth={250} padding="$4" backgroundColor="$blue4">
            <Text fontSize="$7" fontWeight="bold" color="$blue11">
              150
            </Text>
            <Text color="$blue11" fontSize="$4">
              Ventas Hoy
            </Text>
          </Card>

          <Card flex={1} minWidth={250} padding="$4" backgroundColor="$green4">
            <Text fontSize="$7" fontWeight="bold" color="$green11">
              8
            </Text>
            <Text color="$green11" fontSize="$4">
              Sorteos Abiertos
            </Text>
          </Card>

          <Card flex={1} minWidth={250} padding="$4" backgroundColor="$purple4">
            <Text fontSize="$7" fontWeight="bold" color="$purple11">
              $45,320
            </Text>
            <Text color="$purple11" fontSize="$4">
              Total del Día
            </Text>
          </Card>

          <Card flex={1} minWidth={250} padding="$4" backgroundColor="$orange4">
            <Text fontSize="$7" fontWeight="bold" color="$orange11">
              12
            </Text>
            <Text color="$orange11" fontSize="$4">
              Vendedores Activos
            </Text>
          </Card>
        </XStack>

        <Text fontSize="$6" fontWeight="600" marginTop="$4" color="$color">
          Resumen de Actividad
        </Text>
        <Card padding="$4">
          <Text color="$secondary">
            Sistema funcionando correctamente. Todos los sorteos están sincronizados.
          </Text>
        </Card>
      </YStack>
    </ScrollView>
  );

  const renderVentanaDashboard = () => (
    <ScrollView>
      <YStack padding="$4" gap="$4">
        <Text fontSize="$8" fontWeight="bold" color="$color">
          Dashboard Ventana
        </Text>

        <XStack gap="$4" flexWrap="wrap">
          <Card flex={1} minWidth={250} padding="$4" backgroundColor="$blue4">
            <Text fontSize="$7" fontWeight="bold" color="$blue11">
              45
            </Text>
            <Text color="$blue11" fontSize="$4">
              Ventas de mis Vendedores
            </Text>
          </Card>

          <Card flex={1} minWidth={250} padding="$4" backgroundColor="$green4">
            <Text fontSize="$7" fontWeight="bold" color="$green11">
              $12,540
            </Text>
            <Text color="$green11" fontSize="$4">
              Total Vendido
            </Text>
          </Card>
        </XStack>
      </YStack>
    </ScrollView>
  );

  const renderVendedorDashboard = () => (
    <ScrollView>
      <YStack padding="$4" gap="$4">
        <Text fontSize="$8" fontWeight="bold" color="$color">
          Dashboard Vendedor
        </Text>

        <XStack gap="$4" flexWrap="wrap">
          <Card flex={1} minWidth={250} padding="$4" backgroundColor="$blue4">
            <Text fontSize="$7" fontWeight="bold" color="$blue11">
              23
            </Text>
            <Text color="$blue11" fontSize="$4">
              Tiquetes Vendidos Hoy
            </Text>
          </Card>

          <Card flex={1} minWidth={250} padding="$4" backgroundColor="$green4">
            <Text fontSize="$7" fontWeight="bold" color="$green11">
              $3,450
            </Text>
            <Text color="$green11" fontSize="$4">
              Total del Día
            </Text>
          </Card>
        </XStack>
      </YStack>
    </ScrollView>
  );

  return (
    <>
      {user?.role === UserRole.ADMIN && renderAdminDashboard()}
      {user?.role === UserRole.VENTANA && renderVentanaDashboard()}
      {user?.role === UserRole.VENDEDOR && renderVendedorDashboard()}
    </>
  );
}