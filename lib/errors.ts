// lib/errors.ts
// ============================================
// ERROR CODES ENUM
// ============================================

export enum ErrorCode {
  // Auth Errors (1xxx)
  INVALID_CREDENTIALS = 'AUTH_1001',
  UNAUTHORIZED = 'AUTH_1002',
  TOKEN_EXPIRED = 'AUTH_1003',
  FORBIDDEN = 'AUTH_1004',
  SESSION_EXPIRED = 'AUTH_1005',
  
  // Business Logic Errors (2xxx)
  SORTEO_IN_CUTOFF = 'BIZ_2001',
  SORTEO_EXPIRED = 'BIZ_2002',
  SORTEO_ALREADY_EVALUATED = 'BIZ_2003',
  INVALID_REVENTADO_REFERENCE = 'BIZ_2004',
  INSUFFICIENT_BALANCE = 'BIZ_2005',
  DUPLICATE_NUMBER = 'BIZ_2006',
  TICKET_ALREADY_PAID = 'BIZ_2007',
  INVALID_TICKET_STATUS = 'BIZ_2008',
  
  // Validation Errors (3xxx)
  VALIDATION_ERROR = 'VAL_3001',
  INVALID_INPUT = 'VAL_3002',
  MISSING_REQUIRED_FIELD = 'VAL_3003',
  INVALID_FORMAT = 'VAL_3004',
  
  // Server Errors (5xxx)
  SERVER_ERROR = 'SVR_5000',
  NETWORK_ERROR = 'SVR_5001',
  NOT_FOUND = 'SVR_5404',
  RATE_LIMIT_EXCEEDED = 'SVR_5429',
  SERVICE_UNAVAILABLE = 'SVR_5503',
}

// ============================================
// ERROR MESSAGES (Español)
// ============================================

const ERROR_MESSAGES: Record<ErrorCode, string> = {
  // Auth
  [ErrorCode.INVALID_CREDENTIALS]: 'Usuario o contraseña incorrectos',
  [ErrorCode.UNAUTHORIZED]: 'Debes iniciar sesión para continuar',
  [ErrorCode.TOKEN_EXPIRED]: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente',
  [ErrorCode.FORBIDDEN]: 'No tienes permisos para realizar esta acción',
  [ErrorCode.SESSION_EXPIRED]: 'Tu sesión ha expirado',
  
  // Business Logic
  [ErrorCode.SORTEO_IN_CUTOFF]: 'El sorteo está en período de bloqueo. No se pueden crear tickets',
  [ErrorCode.SORTEO_EXPIRED]: 'El sorteo ya ha pasado. No se pueden crear tickets',
  [ErrorCode.SORTEO_ALREADY_EVALUATED]: 'Este sorteo ya fue evaluado',
  [ErrorCode.INVALID_REVENTADO_REFERENCE]: 'El reventado debe referenciar un número existente en el ticket',
  [ErrorCode.INSUFFICIENT_BALANCE]: 'Saldo insuficiente para completar la operación',
  [ErrorCode.DUPLICATE_NUMBER]: 'El número ya está en el ticket',
  [ErrorCode.TICKET_ALREADY_PAID]: 'Este ticket ya fue pagado',
  [ErrorCode.INVALID_TICKET_STATUS]: 'Estado de ticket inválido para esta operación',
  
  // Validation
  [ErrorCode.VALIDATION_ERROR]: 'Los datos ingresados no son válidos',
  [ErrorCode.INVALID_INPUT]: 'Entrada inválida. Verifica los datos',
  [ErrorCode.MISSING_REQUIRED_FIELD]: 'Falta completar campos requeridos',
  [ErrorCode.INVALID_FORMAT]: 'Formato inválido',
  
  // Server
  [ErrorCode.SERVER_ERROR]: 'Error del servidor. Intenta nuevamente',
  [ErrorCode.NETWORK_ERROR]: 'Error de conexión. Verifica tu internet',
  [ErrorCode.NOT_FOUND]: 'Recurso no encontrado',
  [ErrorCode.RATE_LIMIT_EXCEEDED]: 'Demasiadas solicitudes. Espera un momento',
  [ErrorCode.SERVICE_UNAVAILABLE]: 'Servicio no disponible. Intenta más tarde',
};

// ============================================
// BASE ERROR CLASS
// ============================================

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly timestamp: Date;
  public readonly metadata?: Record<string, any>;

  constructor(
    message: string,
    code: ErrorCode,
    statusCode: number = 500,
    isOperational: boolean = true,
    metadata?: Record<string, any>
  ) {
    super(message);
    
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.timestamp = new Date();
    this.metadata = metadata;

    // Mantiene stack trace correcto en V8
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      timestamp: this.timestamp.toISOString(),
      metadata: this.metadata,
    };
  }
}

// ============================================
// SPECIFIC ERROR CLASSES
// ============================================

export class ValidationError extends AppError {
  constructor(message: string, metadata?: Record<string, any>) {
    super(
      message, 
      ErrorCode.VALIDATION_ERROR, 
      400, 
      true,
      metadata
    );
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends AppError {
  constructor(message?: string, code = ErrorCode.INVALID_CREDENTIALS) {
    super(
      message || ERROR_MESSAGES[code],
      code,
      401,
      true
    );
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends AppError {
  constructor(message?: string) {
    super(
      message || ERROR_MESSAGES[ErrorCode.FORBIDDEN],
      ErrorCode.FORBIDDEN,
      403,
      true
    );
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Recurso') {
    super(
      `${resource} no encontrado`,
      ErrorCode.NOT_FOUND,
      404,
      true
    );
    this.name = 'NotFoundError';
  }
}

export class BusinessLogicError extends AppError {
  constructor(
    message: string, 
    code: ErrorCode, 
    metadata?: Record<string, any>
  ) {
    super(message, code, 400, true, metadata);
    this.name = 'BusinessLogicError';
  }
}

export class NetworkError extends AppError {
  constructor(originalError?: any) {
    super(
      ERROR_MESSAGES[ErrorCode.NETWORK_ERROR],
      ErrorCode.NETWORK_ERROR,
      0,
      true,
      { originalError: originalError?.message }
    );
    this.name = 'NetworkError';
  }
}

// ============================================
// ERROR PARSER (para errores de Axios)
// ============================================

import axios from 'axios';

export function parseAPIError(error: any): AppError {
  // Si ya es un AppError, retornarlo
  if (error instanceof AppError) {
    return error;
  }

  // Error de Axios
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const data = error.response?.data;
    
    // Sin conexión / timeout
    if (!error.response || error.code === 'ECONNABORTED') {
      return new NetworkError(error);
    }
    
    // Mapeo por status code
    switch (status) {
      case 400:
        // Ver si el backend envía un código de error específico
        const errorCode = data?.code as ErrorCode;
        if (errorCode && ERROR_MESSAGES[errorCode]) {
          return new AppError(
            data?.message || ERROR_MESSAGES[errorCode],
            errorCode,
            400,
            true,
            data?.errors
          );
        }
        return new ValidationError(
          data?.message || ERROR_MESSAGES[ErrorCode.VALIDATION_ERROR],
          data?.errors
        );
      
      case 401:
        const authCode = data?.code === ErrorCode.TOKEN_EXPIRED 
          ? ErrorCode.TOKEN_EXPIRED 
          : ErrorCode.UNAUTHORIZED;
        return new AuthenticationError(data?.message, authCode);
      
      case 403:
        return new AuthorizationError(data?.message);
      
      case 404:
        return new NotFoundError(data?.resource || 'Recurso');
      
      case 422:
        return new ValidationError(
          data?.message || 'Error de validación',
          data?.errors
        );
      
      case 429:
        return new AppError(
          ERROR_MESSAGES[ErrorCode.RATE_LIMIT_EXCEEDED],
          ErrorCode.RATE_LIMIT_EXCEEDED,
          429
        );
      
      case 503:
        return new AppError(
          ERROR_MESSAGES[ErrorCode.SERVICE_UNAVAILABLE],
          ErrorCode.SERVICE_UNAVAILABLE,
          503
        );
      
      default:
        return new AppError(
          data?.message || ERROR_MESSAGES[ErrorCode.SERVER_ERROR],
          ErrorCode.SERVER_ERROR,
          status || 500,
          true,
          { originalError: error.message }
        );
    }
  }
  
  // Error desconocido
  return new AppError(
    error?.message || 'Error desconocido',
    ErrorCode.SERVER_ERROR,
    500,
    false,
    { originalError: error }
  );
}

// ============================================
// ERROR HANDLER
// ============================================

export function getErrorMessage(error: unknown): string {
  if (error instanceof AppError) {
    return error.message || ERROR_MESSAGES[error.code];
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return 'Ha ocurrido un error inesperado';
}

export function handleError(error: unknown): string {
  const appError = error instanceof AppError 
    ? error 
    : parseAPIError(error);
  
  const message = getErrorMessage(appError);
  
  // Log en desarrollo
  if (__DEV__) {
    console.error('🔴 Error:', {
      code: appError instanceof AppError ? appError.code : 'UNKNOWN',
      message,
      timestamp: new Date().toISOString(),
      stack: appError instanceof Error ? appError.stack : undefined,
    });
  }
  
  // TODO: En producción, enviar a Sentry (FASE 4)
  // if (!__DEV__ && typeof Sentry !== 'undefined') {
  //   Sentry.captureException(appError);
  // }
  
  return message;
}

// ============================================
// TYPE GUARDS
// ============================================

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

export function isNetworkError(error: unknown): boolean {
  return error instanceof NetworkError || 
         (error instanceof AppError && error.code === ErrorCode.NETWORK_ERROR);
}

export function isAuthError(error: unknown): boolean {
  if (!(error instanceof AppError)) return false;
  return error.code === ErrorCode.UNAUTHORIZED || 
         error.code === ErrorCode.TOKEN_EXPIRED ||
         error.code === ErrorCode.INVALID_CREDENTIALS;
}

export function isValidationError(error: unknown): boolean {
  return error instanceof ValidationError ||
         (error instanceof AppError && error.code === ErrorCode.VALIDATION_ERROR);
}