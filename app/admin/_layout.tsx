import React from 'react';
import { Slot } from 'expo-router';
import { ProtectedRoute } from '../../components/layout/ProtectedRoute.js';
import { UserRole } from '../../types/auth.types.js';

export default function AdminLayout() {
  return (
    <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
      <Slot />
    </ProtectedRoute>
  );
}