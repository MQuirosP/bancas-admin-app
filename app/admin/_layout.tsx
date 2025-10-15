import React from 'react';
import { Slot } from 'expo-router';
import { ProtectedRoute } from '../../components/layout/ProtectedRoute';
import { UserRole } from '../../types/auth.types';

export default function AdminLayout() {
  return (
    <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
      <Slot />
    </ProtectedRoute>
  );
}