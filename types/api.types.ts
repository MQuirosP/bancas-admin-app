export interface ApiError {
  success: false;
  code?: string;
  message: string;
  details?: Array<{
    field?: string;
    message: string;
    code?: string;
  }>;
  unrecognized_keys?: string[];
  traceId?: string;
}

export interface ApiSuccess<T = unknown> {
  success: true;
  data: T;
}

export type ApiResponse<T = unknown> = ApiSuccess<T> | ApiError;