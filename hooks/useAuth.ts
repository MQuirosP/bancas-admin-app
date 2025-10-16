// hooks/useAuth.ts
import { useAuthStore } from '../store/auth.store';

export function useAuth() {
  const { user, isAuthenticated, login, logout } = useAuthStore();

  return {
    user,
    isAuthenticated,
    login,
    logout,
  };
}