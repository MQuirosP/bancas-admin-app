import React from 'react';
import { YStack, Text, ScrollView, Card } from 'tamagui';

export default function ReportesScreen() {
  return (
    <ScrollView>
      <YStack padding="$4" gap="$4">
        <Text fontSize="$8" fontWeight="bold" color="$color">
          Reportes y Analytics
        </Text>

        <YStack gap="$3">
          <Card padding="$4">
            <Text fontSize="$5" fontWeight="600" marginBottom="$2">
              Ventas por Día
            </Text>
            <Text color="$textSecondary">Gráfico de ventas diarias</Text>
          </Card>

          <Card padding="$4">
            <Text fontSize="$5" fontWeight="600" marginBottom="$2">
              Ventas por Vendedor
            </Text>
            <Text color="$textSecondary">Ranking de vendedores</Text>
          </Card>

          <Card padding="$4">
            <Text fontSize="$5" fontWeight="600" marginBottom="$2">
              Ventas por Ventana
            </Text>
            <Text color="$textSecondary">Comparativa entre ventanas</Text>
          </Card>

          <Card padding="$4">
            <Text fontSize="$5" fontWeight="600" marginBottom="$2">
              Números Más Jugados
            </Text>
            <Text color="$textSecondary">Estadísticas de números populares</Text>
          </Card>
        </YStack>
      </YStack>
    </ScrollView>
  );
}