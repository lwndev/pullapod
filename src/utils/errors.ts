/**
 * Custom error types and error handling utilities
 */

export enum ErrorCode {
  // Validation errors
  INVALID_INPUT = 'INVALID_INPUT',
  INVALID_URL = 'INVALID_URL',
  INVALID_DATE = 'INVALID_DATE',
  INVALID_RANGE = 'INVALID_RANGE',

  // API errors
  API_ERROR = 'API_ERROR',
  API_RATE_LIMIT = 'API_RATE_LIMIT',
  API_UNAUTHORIZED = 'API_UNAUTHORIZED',
  API_NOT_FOUND = 'API_NOT_FOUND',

  // Network errors
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT = 'TIMEOUT',

  // File system errors
  FILE_NOT_FOUND = 'FILE_NOT_FOUND',
  FILE_READ_ERROR = 'FILE_READ_ERROR',
  FILE_WRITE_ERROR = 'FILE_WRITE_ERROR',

  // General errors
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export class AppError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(ErrorCode.INVALID_INPUT, message, details);
    this.name = 'ValidationError';
  }
}

export class ApiError extends AppError {
  constructor(message: string, code: ErrorCode = ErrorCode.API_ERROR, details?: any) {
    super(code, message, details);
    this.name = 'ApiError';
  }
}

export class NetworkError extends AppError {
  constructor(message: string, details?: any) {
    super(ErrorCode.NETWORK_ERROR, message, details);
    this.name = 'NetworkError';
  }
}

/**
 * Format error message for user display
 */
export function formatErrorMessage(error: unknown): string {
  if (error instanceof AppError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

/**
 * Check if error is a network-related error
 */
export function isNetworkError(error: unknown): boolean {
  if (error instanceof NetworkError) {
    return true;
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes('network') ||
      message.includes('timeout') ||
      message.includes('econnrefused') ||
      message.includes('enotfound')
    );
  }

  return false;
}
