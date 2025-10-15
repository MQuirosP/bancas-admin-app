export enum UserRole {
  ADMIN = 'ADMIN',
  VENTANA = 'VENTANA',
  VENDEDOR = 'VENDEDOR',
}

export interface User {
  id: string;
  code: string;
  name: string;
  email: string;
  username: string;
  role: UserRole;
  bancaId?: string;
  ventanaId?: string;
}

export interface AuthTokens {
  token: string;
  refreshToken?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}