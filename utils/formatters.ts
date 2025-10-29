import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-CR', {
    style: 'currency',
    currency: 'CRC',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: string | Date, formatStr: string = 'PPP'): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, formatStr, { locale: es });
}

export function formatDateTime(date: string | Date): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, 'PPP HH:mm', { locale: es });
}

export function formatNumber(value: number, decimals: number = 2): string {
  return value.toFixed(decimals);
}

export function formatUserCode(code: string): string {
  return code.toUpperCase();
}

/**
 * Formatters para tickets - Sistema Unificado v2.0
 */

/**
 * Formatear fecha de creación de ticket
 * Formato: dd/MM/yyyy HH:mm
 */
export function formatTicketDate(date: string | Date): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, 'dd/MM/yyyy HH:mm', { locale: es });
}

/**
 * Formatear fecha de pago con segundos
 * Formato: dd/MM/yyyy HH:mm:ss
 */
export function formatPaymentDate(date: string | Date): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, 'dd/MM/yyyy HH:mm:ss', { locale: es });
}

/**
 * Formatear número de ticket con fallback
 * Si no tiene ticketNumber, usa los últimos 8 caracteres del ID
 */
export function formatTicketNumber(ticket: { ticketNumber?: string; id: string }): string {
  return ticket.ticketNumber || `#${ticket.id.slice(-8)}`;
}

/**
 * Formatear número de jugada
 * Maneja casos especiales como REVENTADO
 */
export function formatJugadaNumber(number?: string): string {
  return number || 'N/A';
}

/**
 * Formatear tipo de jugada
 * Transforma REVENTADO a EXTRA para mejor UX
 */
export function formatJugadaType(type?: string): string {
  if (!type) return 'N/A';
  return type === 'REVENTADO' ? 'EXTRA' : type;
}

/**
 * Formatear multiplicador de jugada
 */
export function formatMultiplier(multiplier?: number): string {
  if (!multiplier) return '1x';
  return `${multiplier}x`;
}

/**
 * Formatear porcentaje de pago
 */
export function formatPaymentPercentage(percentage: number): string {
  return `${Math.round(percentage)}%`;
}