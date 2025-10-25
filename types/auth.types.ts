// types/auth.types.ts

export enum UserRole {
  ADMIN = 'ADMIN',
  VENTANA = 'VENTANA',
  VENDEDOR = 'VENDEDOR',
}

export interface User {
  id: string;
  username: string; // Cambiado de email a username
  email?: string;
  name: string;
  role: UserRole;
  bancaId?: string; // Para ADMIN y VENTANA
  ventanaId?: string; // Para VENDEDOR
  createdAt?: Date;
  updatedAt?: Date;
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