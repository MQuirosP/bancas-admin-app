export enum UserRole {
  ADMIN = 'ADMIN',
  VENTANA = 'VENTANA',
  VENDEDOR = 'VENDEDOR',
}

export interface User {
  id: string;
  code: string;
  name: string;
  username: string;
  email?: string;
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

// ✅ CAMBIO: Backend devuelve accessToken/refreshToken, NO user
export interface LoginResponse {
  accessToken: string;      // ✅ era "token"
  refreshToken: string;      // ✅ agregado
  user?: User;               // ✅ opcional porque no lo devuelve el backend
}