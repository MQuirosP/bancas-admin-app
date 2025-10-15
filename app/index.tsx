import { Redirect } from 'expo-router';
import { useAuthStore } from '../store/auth.store.js';

export default function Index() {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  return <Redirect href="/(dashboard)" />;
}