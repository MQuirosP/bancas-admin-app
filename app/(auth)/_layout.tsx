import React from 'react';
import { YStack } from 'tamagui';
import { Slot } from 'expo-router';

export default function AuthLayout() {
  return (
    <YStack flex={1} backgroundColor="$background">
      <Slot />
    </YStack>
  );
}