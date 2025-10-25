import { RestrictionRule } from "../types/models.types";

export function isSorteoInCutoff(
  sorteoTime: Date,
  currentTime: Date,
  cutoffMinutes: number
): boolean {
  const diffMinutes = (sorteoTime.getTime() - currentTime.getTime()) / (1000 * 60);
  return diffMinutes <= cutoffMinutes && diffMinutes > 0;
}

export function getSalesCutoffMinutes(
  rules: RestrictionRule[],
  userId: string,
  ventanaId: string,
  bancaId: string,
  defaultCutoff: number = 5
): number {
  // Priority: USER > VENTANA > BANCA
  const userRule = rules.find((r) => r.userId === userId && r.salesCutoffMinutes != null);
  if (userRule?.salesCutoffMinutes) return userRule.salesCutoffMinutes;

  const ventanaRule = rules.find(
    (r) => r.ventanaId === ventanaId && r.salesCutoffMinutes != null
  );
  if (ventanaRule?.salesCutoffMinutes) return ventanaRule.salesCutoffMinutes;

  const bancaRule = rules.find((r) => r.bancaId === bancaId && r.salesCutoffMinutes != null);
  if (bancaRule?.salesCutoffMinutes) return bancaRule.salesCutoffMinutes;

  return defaultCutoff;
}

export function canCreateTicket(
  sorteoDate: string,
  sorteoHour: string,
  cutoffMinutes: number
): { canCreate: boolean; message?: string } {
  const sorteoDateTime = new Date(`${sorteoDate}T${sorteoHour}`);
  const now = new Date();

  if (isSorteoInCutoff(sorteoDateTime, now, cutoffMinutes)) {
    const minutesLeft = Math.floor((sorteoDateTime.getTime() - now.getTime()) / (1000 * 60));
    return {
      canCreate: false,
      message: `El sorteo está dentro del período de bloqueo (${minutesLeft} minutos restantes)`,
    };
  }

  if (sorteoDateTime < now) {
    return {
      canCreate: false,
      message: 'El sorteo ya ha pasado',
    };
  }

  return { canCreate: true };
}