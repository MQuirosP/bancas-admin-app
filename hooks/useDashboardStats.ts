// hooks/useDashboardStats.ts
import { useMemo } from 'react';
import { useTodayTicketsQuery } from './useTickets';
import { useActiveSorteosQuery } from './useSorteos';
import { useActiveBancaRulesQuery } from './useRestrictionRules';
import type { Ticket } from '../types/api.types';

/**
 * Hook para estadísticas del dashboard de Banca (ADMIN)
 */
export function useBancaDashboardStats(bancaId?: string) {
  const { data: ticketsData, isLoading: loadingTickets } = useTodayTicketsQuery();
  const { data: activeSorteos, isLoading: loadingSorteos } = useActiveSorteosQuery();
  const { data: activeRules, isLoading: loadingRules } = useActiveBancaRulesQuery(bancaId);

  const stats = useMemo(() => {
    const tickets = ticketsData?.data || [];

    // Total de ventas hoy
    const totalSalesToday = tickets.reduce((sum, t) => sum + t.totalAmount, 0);

    // Contar tickets activos y evaluados
    const activeTicketsCount = tickets.filter(t => t.status === 'ACTIVE').length;
    const evaluatedTicketsCount = tickets.filter(t => t.status === 'EVALUATED').length;

    // Top loterías (agrupadas por lotería)
    const loteriaMap = new Map<
      string,
      { loteriaId: string; loteriaName: string; totalSales: number; ticketCount: number }
    >();

    tickets.forEach((ticket) => {
      if (!ticket.loteria) return;
      
      const key = ticket.loteria.id;
      const existing = loteriaMap.get(key);
      
      if (existing) {
        existing.totalSales += ticket.totalAmount;
        existing.ticketCount += 1;
      } else {
        loteriaMap.set(key, {
          loteriaId: ticket.loteria.id,
          loteriaName: ticket.loteria.name,
          totalSales: ticket.totalAmount,
          ticketCount: 1,
        });
      }
    });

    const topLoterias = Array.from(loteriaMap.values())
      .sort((a, b) => b.totalSales - a.totalSales)
      .slice(0, 5);

    // Ventas por hora (heatmap)
    const hourlyMap = new Map<number, { sales: number; ticketCount: number }>();
    
    tickets.forEach((ticket) => {
      const hour = new Date(ticket.createdAt).getHours();
      const existing = hourlyMap.get(hour);
      
      if (existing) {
        existing.sales += ticket.totalAmount;
        existing.ticketCount += 1;
      } else {
        hourlyMap.set(hour, { sales: ticket.totalAmount, ticketCount: 1 });
      }
    });

    // Crear array de 24 horas (0-23)
    const salesByHour = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      sales: hourlyMap.get(hour)?.sales || 0,
      ticketCount: hourlyMap.get(hour)?.ticketCount || 0,
    }));

    return {
      totalSalesToday,
      totalSalesMonth: 0, // TODO: Implementar cuando haya endpoint para mes
      activeTicketsCount,
      evaluatedTicketsCount,
      activeSorteos: activeSorteos?.length || 0,
      activeRules: activeRules?.length || 0,
      topLoterias,
      salesByHour,
    };
  }, [ticketsData, activeSorteos, activeRules]);

  return {
    stats,
    isLoading: loadingTickets || loadingSorteos || loadingRules,
  };
}

/**
 * Hook para estadísticas del dashboard de Ventana
 */
export function useVentanaDashboardStats(ventanaId?: string) {
  const { data: ticketsData, isLoading: loadingTickets } = useTodayTicketsQuery(ventanaId);
  const { data: activeSorteos, isLoading: loadingSorteos } = useActiveSorteosQuery();

  const stats = useMemo(() => {
    const tickets = ticketsData?.data || [];

    // Conteo de tickets hoy
    const ticketsCountToday = tickets.length;

    // Total de ventas hoy
    const totalSalesToday = tickets.reduce((sum, t) => sum + t.totalAmount, 0);

    // Tickets activos (esperando evaluación)
    const pendingEvaluations = tickets.filter((t) => t.status === 'ACTIVE').length;

    // Ventas por vendedor
    const vendorMap = new Map<
      string,
      { vendedorId: string; vendedorName: string; totalSales: number; ticketCount: number }
    >();

    tickets.forEach((ticket) => {
      if (!ticket.vendedor) return;
      
      const key = ticket.vendedor.id;
      const existing = vendorMap.get(key);
      
      if (existing) {
        existing.totalSales += ticket.totalAmount;
        existing.ticketCount += 1;
      } else {
        vendorMap.set(key, {
          vendedorId: ticket.vendedor.id,
          vendedorName: ticket.vendedor.name,
          totalSales: ticket.totalAmount,
          ticketCount: 1,
        });
      }
    });

    const salesByVendor = Array.from(vendorMap.values())
      .sort((a, b) => b.totalSales - a.totalSales);

    // Top números vendidos
    const numberMap = new Map<string, { number: string; count: number; totalAmount: number }>();

    tickets.forEach((ticket) => {
      ticket.jugadas.forEach((jugada) => {
        if (jugada.type === 'NUMERO') {
          const key = jugada.number;
          const existing = numberMap.get(key);
          
          if (existing) {
            existing.count += 1;
            existing.totalAmount += jugada.amount;
          } else {
            numberMap.set(key, {
              number: jugada.number,
              count: 1,
              totalAmount: jugada.amount,
            });
          }
        } else if (jugada.type === 'REVENTADO' && jugada.reventadoNumber) {
          // Para reventado, contar el número reventado
          const key = jugada.reventadoNumber;
          const existing = numberMap.get(key);
          
          if (existing) {
            existing.count += 1;
            existing.totalAmount += jugada.amount;
          } else {
            numberMap.set(key, {
              number: jugada.reventadoNumber,
              count: 1,
              totalAmount: jugada.amount,
            });
          }
        }
      });
    });

    const topNumbers = Array.from(numberMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      ticketsCountToday,
      totalSalesToday,
      pendingEvaluations,
      activeSorteos: activeSorteos?.length || 0,
      salesByVendor,
      topNumbers,
      tickets, // Incluir tickets para la tabla
    };
  }, [ticketsData, activeSorteos]);

  return {
    stats,
    isLoading: loadingTickets || loadingSorteos,
  };
}