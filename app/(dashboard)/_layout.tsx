import React from 'react';
import { Footer, Header, YStack } from 'tamagui';
import { Slot } from 'expo-router';
import { ProtectedRoute } from '../../components/layout/ProtectedRoute';
import { Drawer } from '../../components/layout/Drawer';

export default function DashboardLayout() {
  return (
    <ProtectedRoute>
      <YStack flex={1} backgroundColor="$background">
        <Header />
        <Drawer />
        <YStack flex={1}>
          <Slot />
        </YStack>
        <Footer />
      </YStack>
    </ProtectedRoute>
  );
}