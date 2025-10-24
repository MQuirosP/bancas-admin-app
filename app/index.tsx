// app/index.tsx  
import { Redirect } from 'expo-router';  
import { useAuthStore } from '../store/auth.store';  
  
export default function Index() {  
  const { isAuthenticated, user } = useAuthStore((state) => ({  
    isAuthenticated: state.isAuthenticated,  
    user: state.user,  
  }));  
  
  if (isAuthenticated && user) {  
    // Redirigir según el rol  
    if (user.role === 'ADMIN') {  
      return <Redirect href="/admin" />;  
    } else if (user.role === 'VENTANA') {  
      return <Redirect href="/ventana" />;  
    } else if (user.role === 'VENDEDOR') {  
      return <Redirect href="/vendedor" />;  
    }  
  }  
  
  return <Redirect href="/(auth)/login" />;  
}