import React from 'react';
import { XStack, Text, Anchor, Separator } from 'tamagui';

export const Footer: React.FC = () => {
  return (
    <XStack
      backgroundColor="$footerBg"
      borderTopWidth={1}
      borderTopColor="$borderColor"
      paddingHorizontal="$4"
      paddingVertical="$3"
      justifyContent="center"
      alignItems="center"
      gap="$3"
      height={56}
      shadowColor="$shadowColor"
      shadowOpacity={0.1}
      shadowRadius={8}
      elevation={2}
    >
      <Text fontSize="$2" color="$textTertiary" fontWeight="400">
        © 2025 Bancas Admin
      </Text>
      
      <Separator vertical height={16} borderColor="$borderColor" />
      
      <Anchor 
        href="#" 
        fontSize="$2" 
        color="$textSecondary"
        textDecorationLine="none"
        hoverStyle={{ color: '$primary' }}
        pressStyle={{ color: '$primaryDark' }}
      >
        Soporte
      </Anchor>
      
      <Separator vertical height={16} borderColor="$borderColor" />
      
      <Anchor 
        href="#" 
        fontSize="$2" 
        color="$textSecondary"
        textDecorationLine="none"
        hoverStyle={{ color: '$primary' }}
        pressStyle={{ color: '$primaryDark' }}
      >
        Términos
      </Anchor>
      
      <Separator vertical height={16} borderColor="$borderColor" />
      
      <Anchor 
        href="#" 
        fontSize="$2" 
        color="$textSecondary"
        textDecorationLine="none"
        hoverStyle={{ color: '$primary' }}
        pressStyle={{ color: '$primaryDark' }}
      >
        Privacidad
      </Anchor>
    </XStack>
  );
};