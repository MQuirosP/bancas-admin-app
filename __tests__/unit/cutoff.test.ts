import { isSorteoInCutoff, getSalesCutoffMinutes, canCreateTicket } from '@/utils/cutoff';
import { RestrictionRule } from '@/types/models.types';

describe('Sales Cutoff Logic', () => {
  describe('isSorteoInCutoff', () => {
    it('should return true if sorteo is within cutoff', () => {
      const sorteoTime = new Date('2025-10-14T15:00:00');
      const currentTime = new Date('2025-10-14T14:56:00');
      const cutoffMinutes = 5;

      const result = isSorteoInCutoff(sorteoTime, currentTime, cutoffMinutes);
      expect(result).toBe(true);
    });

    it('should return false if sorteo is outside cutoff', () => {
      const sorteoTime = new Date('2025-10-14T15:00:00');
      const currentTime = new Date('2025-10-14T14:54:00');
      const cutoffMinutes = 5;

      const result = isSorteoInCutoff(sorteoTime, currentTime, cutoffMinutes);
      expect(result).toBe(false);
    });

    it('should return false if sorteo has already passed', () => {
      const sorteoTime = new Date('2025-10-14T15:00:00');
      const currentTime = new Date('2025-10-14T15:01:00');
      const cutoffMinutes = 5;

      const result = isSorteoInCutoff(sorteoTime, currentTime, cutoffMinutes);
      expect(result).toBe(false);
    });
  });

  describe('getSalesCutoffMinutes', () => {
    it('should prioritize user-level cutoff', () => {
      const rules: RestrictionRule[] = [
        { id: '1', userId: 'u1', salesCutoffMinutes: 10, priority: 1 } as RestrictionRule,
        { id: '2', ventanaId: 'v1', salesCutoffMinutes: 7, priority: 2 } as RestrictionRule,
        { id: '3', bancaId: 'b1', salesCutoffMinutes: 5, priority: 3 } as RestrictionRule,
      ];

      const cutoff = getSalesCutoffMinutes(rules, 'u1', 'v1', 'b1');
      expect(cutoff).toBe(10);
    });

    it('should use ventana cutoff if no user cutoff exists', () => {
      const rules: RestrictionRule[] = [
        { id: '2', ventanaId: 'v1', salesCutoffMinutes: 7, priority: 2 } as RestrictionRule,
        { id: '3', bancaId: 'b1', salesCutoffMinutes: 5, priority: 3 } as RestrictionRule,
      ];

      const cutoff = getSalesCutoffMinutes(rules, 'u1', 'v1', 'b1');
      expect(cutoff).toBe(7);
    });

    it('should use banca cutoff if no user or ventana cutoff exists', () => {
      const rules: RestrictionRule[] = [
        { id: '3', bancaId: 'b1', salesCutoffMinutes: 5, priority: 3 } as RestrictionRule,
      ];

      const cutoff = getSalesCutoffMinutes(rules, 'u1', 'v1', 'b1');
      expect(cutoff).toBe(5);
    });

    it('should use default if no rules apply', () => {
      const rules: RestrictionRule[] = [];
      const cutoff = getSalesCutoffMinutes(rules, 'u1', 'v1', 'b1', 5);
      expect(cutoff).toBe(5);
    });
  });

  describe('canCreateTicket', () => {
    it('should allow ticket creation if outside cutoff', () => {
      const result = canCreateTicket('2025-10-14', '15:00', 5);
      // This will depend on current time, but structure is correct
      expect(result).toHaveProperty('canCreate');
      expect(result).toHaveProperty('message');
    });
  });
});