import { useAuthStore } from '@/store/auth.store';
import { UserRole } from '@/types/auth.types';
import { hasPermission } from '@/utils/role';

export function useRoleGuard(allowedRoles: UserRole[]): boolean {
  const { user } = useAuthStore();

  if (!user) return false;

  return hasPermission(user.role, allowedRoles);
}