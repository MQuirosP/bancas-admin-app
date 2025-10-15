import { useAuthStore } from '@/store/auth.store';
import { authService } from '@/services/auth.service';
import { LoginRequest } from '@/types/auth.types';

export function useAuth() {
  const { user, isAuthenticated, setAuth, clearAuth } = useAuthStore();

  const login = async (credentials: LoginRequest) => {
    const response = await authService.login(credentials);
    await setAuth(response.user, response.token);
    return response;
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      // Continue with local logout even if API call fails
    } finally {
      await clearAuth();
    }
  };

  return {
    user,
    isAuthenticated,
    login,
    logout,
  };
}