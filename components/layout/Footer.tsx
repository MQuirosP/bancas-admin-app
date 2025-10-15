import React from 'react';
import { XStack, Text, Anchor } from 'tamagui';

export const Footer: React.FC = () => {
  return (
    <XStack
      backgroundColor="$background"
      borderTopWidth={1}
      borderTopColor="$borderColor"
      paddingHorizontal="$4"
      paddingVertical="$3"
      justifyContent="center"
      alignItems="center"
      gap="$4"
      height={48}
    >
      <Text fontSize="$2" color="$secondary">
        © 2025 Bancas Admin
      </Text>
      <Anchor href="#" fontSize="$2" color="$primary">
        Soporte
      </Anchor>
      <Anchor href="#" fontSize="$2" color="$primary">
        Términos
      </Anchor>
      <Anchor href="#" fontSize="$2" color="$primary">
        Privacidad
      </Anchor>
    </XStack>
  );
};