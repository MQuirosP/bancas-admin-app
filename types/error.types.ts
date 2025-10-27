/**
 * Error codes for Ticket Payment module
 * Maps backend error codes to user-friendly messages
 */

export const PAYMENT_ERROR_CODES = {
  TKT_PAY_001: {
    code: 'TKT_PAY_001',
    message: 'Tiquete no encontrado',
    solution: 'Verifica que el número de tiquete sea válido',
  },
  TKT_PAY_002: {
    code: 'TKT_PAY_002',
    message: 'El tiquete no es ganador',
    solution: 'Solo se pueden pagar tiquetes que ganaron el sorteo',
  },
  TKT_PAY_003: {
    code: 'TKT_PAY_003',
    message: 'El tiquete aún no ha sido evaluado',
    solution: 'Espera a que se realice el sorteo y se evalúen los números',
  },
  TKT_PAY_004: {
    code: 'TKT_PAY_004',
    message: 'El monto pagado excede el premio',
    solution: 'Reduce el monto a pagar al total del premio o menos',
  },
  TKT_PAY_005: {
    code: 'TKT_PAY_005',
    message: 'El tiquete ya tiene un pago registrado',
    solution: 'Verifica el historial de pagos o registra un pago adicional',
  },
  TKT_PAY_006: {
    code: 'TKT_PAY_006',
    message: 'No autorizado para esta operación',
    solution: 'Tu rol no tiene permisos para pagar este tiquete',
  },
  TKT_PAY_007: {
    code: 'TKT_PAY_007',
    message: 'Clave de idempotencia duplicada',
    solution: 'Parece que ya registraste este pago. Recarga la página',
  },
} as const

export type PaymentErrorCode = keyof typeof PAYMENT_ERROR_CODES

/**
 * Get error details by code
 */
export function getPaymentError(errorCode: string) {
  const error = PAYMENT_ERROR_CODES[errorCode as PaymentErrorCode]

  if (!error) {
    return {
      code: 'UNKNOWN',
      message: 'Error desconocido',
      solution: 'Intenta de nuevo o contacta soporte',
    }
  }

  return error
}

/**
 * Format error message with code
 * e.g., "TKT_PAY_004: El monto pagado excede el premio"
 */
export function formatErrorMessage(errorCode: string): string {
  const error = getPaymentError(errorCode)
  return `${error.code}: ${error.message}`
}

/**
 * Get full error details with solution
 * Useful for error modals/toasts
 */
export function getErrorDetails(errorCode: string) {
  return getPaymentError(errorCode)
}

/**
 * Check if error is a payment-specific error
 */
export function isPaymentError(errorCode: string): boolean {
  return errorCode in PAYMENT_ERROR_CODES
}
