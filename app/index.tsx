import { Redirect } from 'expo-router';
import { useAuthStore } from '../store/auth.store';

export default function Index() {
  const { isAuthenticated, user, token } = useAuthStore();

  // Debug
  console.log('📍 Index screen:', { 
    isAuthenticated, 
    hasUser: !!user, 
    hasToken: !!token 
  });

  if (!isAuthenticated) {
    console.log('➡️ Redirecting to login');
    return <Redirect href="/(auth)/login" />;
  }

  console.log('➡️ Redirecting to dashboard');
  return <Redirect href="/(dashboard)" />;
}