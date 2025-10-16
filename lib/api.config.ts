// lib/api.config.ts

// Configuración base de la API
export const API_CONFIG = {
  // Cambia esta URL por la de tu backend
  BASE_URL: process.env.EXPO_PUBLIC_API_URL || 'https://backend-bancas.onrender.com/api/v1',
  
  // Timeout para las peticiones (en ms)
  TIMEOUT: 10000,
  
  // Headers por defecto
  DEFAULT_HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
};

// ✅ Helper para construir URLs completas
export const buildUrl = (endpoint: string): string => {
  // Asegurarse de que el endpoint empiece con /
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${API_CONFIG.BASE_URL}${normalizedEndpoint}`;
};

// ✅ Helper para crear headers con token
export const getAuthHeaders = (token?: string) => {
  const headers: Record<string, string> = { ...API_CONFIG.DEFAULT_HEADERS };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};