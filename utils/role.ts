import { UserRole } from "../types/auth.types";

export const ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.ADMIN]: 'Administrador',
  [UserRole.VENTANA]: 'Ventana',
  [UserRole.VENDEDOR]: 'Vendedor',
};

export function getRoleLabel(role: UserRole): string {
  return ROLE_LABELS[role] || role;
}

export function hasPermission(userRole: UserRole, allowedRoles: UserRole[]): boolean {
  return allowedRoles.includes(userRole);
}

export function isAdmin(role: UserRole): boolean {
  return role === UserRole.ADMIN;
}

export function isVentana(role: UserRole): boolean {
  return role === UserRole.VENTANA;
}

export function isVendedor(role: UserRole): boolean {
  return role === UserRole.VENDEDOR;
}