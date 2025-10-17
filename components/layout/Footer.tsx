// components/layout/Footer.tsx
import React from 'react';
import { XStack, Text } from 'tamagui';

/**
 * Footer: Componente inmutable que se muestra en toda la aplicación.
 * Usa SOLO tokens definidos en tamagui.config.ts
 */
export const Footer: React.FC = () => {
  return (
    <XStack
      backgroundColor="#1a1a1d" // Color fijo oscuro (igual que headerBg)
      borderTopWidth={1}
      borderTopColor="#2a2a2f" // Color fijo oscuro
      paddingHorizontal="$4"
      paddingVertical="$3"
      justifyContent="center"
      alignItems="center"
      height={56}
    >
      <Text fontSize="$3" color="#a1a1aa" fontWeight="400">
        © 2025 Bancas Admin - Todos los derechos reservados
      </Text>
    </XStack>
  );
};