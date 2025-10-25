// src/utils/loteriaRules.helpers.ts
import { LoteriaRulesJson } from '@/types/loteriaRules';

const dayKeys = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'] as const;
export type DayKey = typeof dayKeys[number];

export function isTimeWithinSalesWindow(rules: LoteriaRulesJson, date: Date) {
  const k = dayKeys[date.getDay()];
  const slot = rules.salesHours?.[k];
  if (!slot) return true;
  const hh = `${date.getHours()}`.padStart(2, '0');
  const mm = `${date.getMinutes()}`.padStart(2, '0');
  const now = `${hh}:${mm}`;
  return (!slot.start || now >= slot.start) && (!slot.end || now <= slot.end);
}

export function parseTimesCsv(s?: string): string[] {
  if (!s) return [];
  return s.split(',').map(x => x.trim()).filter(Boolean);
}

export function timesToCsv(arr?: string[]): string {
  return (arr ?? []).join(', ');
}
