// lib/queryClient.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache por 5 minutos
      staleTime: 5 * 60 * 1000,
      // Mantener en cache inactivo por 10 minutos
      gcTime: 10 * 60 * 1000,
      // Reintentar 2 veces en caso de error
      retry: 2,
      // Delay exponencial entre reintentos
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Refetch al hacer focus en la ventana
      refetchOnWindowFocus: true,
      // No refetch al reconectar (para evitar exceso de requests)
      refetchOnReconnect: false,
      // No refetch al montar si los datos son fresh
      refetchOnMount: false,
    },
    mutations: {
      // Reintentar mutaciones fallidas 1 vez
      retry: 1,
      // Delay de 1 segundo antes de reintentar
      retryDelay: 1000,
    },
  },
});

// Query keys para mantener consistencia
export const queryKeys = {
  // Auth
  auth: {
    me: ['auth', 'me'] as const,
  },
  
  // Tickets
  tickets: {
    all: ['tickets'] as const,
    list: (params?: any) => ['tickets', 'list', params] as const,
    detail: (id: string) => ['tickets', 'detail', id] as const,
  },
  
  // Sorteos
  sorteos: {
    all: ['sorteos'] as const,
    list: (params?: any) => ['sorteos', 'list', params] as const,
    detail: (id: string) => ['sorteos', 'detail', id] as const,
    active: ['sorteos', 'active'] as const,
    next: (lotteryId?: string) => ['sorteos', 'next', lotteryId] as const,
  },
  
  // Restriction Rules
  restrictionRules: {
    all: ['restriction-rules'] as const,
    list: (params?: any) => ['restriction-rules', 'list', params] as const,
    byNumber: (number: string, lotteryId?: string) => 
      ['restriction-rules', 'number', number, lotteryId] as const,
  },
  
  // Multipliers
  multipliers: {
    all: ['multipliers'] as const,
    list: (params?: any) => ['multipliers', 'list', params] as const,
    active: (kind?: string) => ['multipliers', 'active', kind] as const,
  },
  
  // Ticket Payments
  ticketPayments: {
    all: ['ticket-payments'] as const,
    list: (params?: any) => ['ticket-payments', 'list', params] as const,
    byTicket: (ticketId: string) => ['ticket-payments', 'ticket', ticketId] as const,
  },
  
  // Dashboard Stats
  dashboard: {
    banca: (date?: string) => ['dashboard', 'banca', date] as const,
    ventana: (ventanaId: string, date?: string) => 
      ['dashboard', 'ventana', ventanaId, date] as const,
  },
};