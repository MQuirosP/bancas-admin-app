import { validateReventadoReferences, validateNumberFormat, validateAmount } from '@/utils/validation';
import { JugadaType } from '@/types/models.types';

describe('Validation Utils', () => {
  describe('validateReventadoReferences', () => {
    it('should validate correct REVENTADO references', () => {
      const jugadas = [
        { type: JugadaType.NUMERO, number: '25', amount: 100 },
        { type: JugadaType.REVENTADO, reventadoNumber: '25', amount: 50 },
      ];

      const result = validateReventadoReferences(jugadas);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect invalid REVENTADO references', () => {
      const jugadas = [
        { type: JugadaType.NUMERO, number: '25', amount: 100 },
        { type: JugadaType.REVENTADO, reventadoNumber: '30', amount: 50 },
      ];

      const result = validateReventadoReferences(jugadas);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('validateNumberFormat', () => {
    it('should validate correct number format', () => {
      expect(validateNumberFormat('00')).toBe(true);
      expect(validateNumberFormat('25')).toBe(true);
      expect(validateNumberFormat('99')).toBe(true);
    });

    it('should reject invalid number format', () => {
      expect(validateNumberFormat('0')).toBe(false);
      expect(validateNumberFormat('100')).toBe(false);
      expect(validateNumberFormat('ab')).toBe(false);
    });
  });

  describe('validateAmount', () => {
    it('should validate positive amounts', () => {
      expect(validateAmount(100)).toBe(true);
      expect(validateAmount(0.01)).toBe(true);
    });

    it('should reject zero or negative amounts', () => {
      expect(validateAmount(0)).toBe(false);
      expect(validateAmount(-10)).toBe(false);
    });
  });
});