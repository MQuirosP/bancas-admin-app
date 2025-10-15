import React from 'react';
import { Slot } from 'expo-router';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { UserRole } from '@/types/auth.types';

export default function VendedorLayout() {
  return (
    <ProtectedRoute allowedRoles={[UserRole.VENDEDOR]}>
      <Slot />
    </ProtectedRoute>
  );
}