import { Jugada, JugadaType } from "../types/models.types";

export function validateReventadoReferences(jugadas: Jugada[]): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  const numeroValues = new Set<string>();

  // Collect all NUMERO values
  jugadas.forEach((jugada) => {
    if (jugada.type === JugadaType.NUMERO && jugada.number) {
      numeroValues.add(jugada.number);
    }
  });

  // Validate REVENTADO references
  jugadas.forEach((jugada, index) => {
    if (jugada.type === JugadaType.REVENTADO && jugada.reventadoNumber) {
      if (!numeroValues.has(jugada.reventadoNumber)) {
        errors.push(
          `Jugada ${index + 1}: REVENTADO ${jugada.reventadoNumber} no referencia un NUMERO existente`
        );
      }
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function validateNumberFormat(number: string): boolean {
  return /^\d{2}$/.test(number);
}

export function validateAmount(amount: number): boolean {
  return amount > 0;
}