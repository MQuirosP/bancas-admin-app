import React from 'react';
import { Slot } from 'expo-router';
import { ProtectedRoute } from '../../components/layout/ProtectedRoute.js';
import { UserRole } from '../../types/auth.types.js';

export default function VentanaLayout() {
  return (
    <ProtectedRoute allowedRoles={[UserRole.VENTANA]}>
      <Slot />
    </ProtectedRoute>
  );
}