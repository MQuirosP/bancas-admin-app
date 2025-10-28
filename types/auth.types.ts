// types/auth.types.ts
// ✅ Consolidar tipos - usar api.types.ts como fuente de verdad

// Re-export Role and User from api.types.ts as source of truth
export type { Role, User } from './api.types';

// Keep UserRole enum for backwards compatibility (deprecated, use Role type)
export enum UserRole {
  ADMIN = 'ADMIN',
  VENTANA = 'VENTANA',
  VENDEDOR = 'VENDEDOR',
}

export interface LoginRequest {
  username: string; // Cambiado de email a username
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
  refreshToken?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface RegisterRequest {
  username: string; // Cambiado de email a username
  name: string;
  password: string;
  role: UserRole;
  bancaId?: string;
  ventanaId?: string;
}