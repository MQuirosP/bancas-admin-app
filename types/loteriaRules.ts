// src/types/loteriaRules.ts
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0=Domingo
export type BetType = 'NUMERO' | 'REVENTADO';

export interface LoteriaRulesJson {
  salesHours?: Partial<Record<
    'sunday'|'monday'|'tuesday'|'wednesday'|'thursday'|'friday'|'saturday',
    { start?: string; end?: string } // "HH:MM"
  >>;
  closingTimeBeforeDraw?: number; // minutos antes del sorteo
  allowedBetTypes?: BetType[];
  reventadoConfig?: {
    enabled: boolean;
    requiresMatchingNumber?: boolean;
    colors?: ('ROJA'|'VERDE')[];
  };
  minBetAmount?: number;
  maxBetAmount?: number;
  maxNumbersPerTicket?: number;
  numberRange?: { min: number; max: number };
  drawSchedule?: {
    frequency: 'diario'|'semanal'|'personalizado';
    times?: string[];          // ["12:00","18:00"]
    daysOfWeek?: Weekday[];    // [0..6]
  };
  autoCreateSorteos?: boolean;
  commissionRules?: {
    ventanaPercentage?: number;
    vendedorPercentage?: number;
    bonusThreshold?: number;
  };
  display?: {
    color?: string;
    icon?: string;
    description?: string;
    featured?: boolean;
  };
  baseMultiplierX?: number; // fallback que hoy ya usa el BE
}

export const DEFAULT_RULES: LoteriaRulesJson = {
  allowedBetTypes: ['NUMERO'],
  reventadoConfig: { enabled: false, requiresMatchingNumber: true, colors: ['ROJA','VERDE'] },
  minBetAmount: 1,
  maxBetAmount: 10000,
  maxNumbersPerTicket: 10,
  numberRange: { min: 0, max: 99 },
  drawSchedule: { frequency: 'diario', times: ['12:00'], daysOfWeek: [1,2,3,4,5,6,0] },
  autoCreateSorteos: false,
  closingTimeBeforeDraw: 0,
};

export function toWeekdays(nums?: number[]): Weekday[] | undefined {
  if (!nums) return undefined;
  return nums
    .map(n => (Number.isInteger(n) && n >= 0 && n <= 6 ? (n as Weekday) : null))
    .filter((v): v is Weekday => v !== null);
}


