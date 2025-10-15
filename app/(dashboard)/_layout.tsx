// app/(dashboard)/_layout.tsx
import React from 'react';
import { YStack } from 'tamagui';
import { Slot } from 'expo-router';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Drawer } from '@/components/layout/Drawer';
import ProtectedRoute from '@/components/layout/ProtectedRoute';

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