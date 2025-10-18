// hooks/useAuth.ts
import { useEffect } from 'react';
import { useAuthStore } from '../store/auth.store';
import { hasTokens } from '../lib/auth.token';

export function useAuth() {
  const { user, isAuthenticated, isLoading, error, login, logout, clearAuth } = useAuthStore();

  // ✅ Verificar tokens al cargar
  useEffect(() => {
    const checkAuth = async () => {
      const tokensExist = await hasTokens();
      
      // Si no hay tokens pero el store dice que está autenticado, limpiar
      if (!tokensExist && isAuthenticated) {
        console.log('⚠️ No hay tokens pero store dice autenticado, limpiando...');
        await clearAuth();
      }
    };
    
    checkAuth();
  }, []);

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
  };
}