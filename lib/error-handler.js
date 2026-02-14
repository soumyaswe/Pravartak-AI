/**
 * Centralized error handling and logging utility
 * Provides consistent error handling across the application
 */

/**
 * Error types for categorization
 */
export const ErrorTypes = {
  AUTHENTICATION: 'AUTHENTICATION',
  VALIDATION: 'VALIDATION',
  DATABASE: 'DATABASE',
  NETWORK: 'NETWORK',
  API: 'API',
  PERMISSION: 'PERMISSION',
  NOT_FOUND: 'NOT_FOUND',
  SERVER: 'SERVER',
  UNKNOWN: 'UNKNOWN',
};

/**
 * Custom Application Error class
 */
export class AppError extends Error {
  constructor(message, type = ErrorTypes.UNKNOWN, statusCode = 500, details = null) {
    super(message);
    this.name = 'AppError';
    this.type = type;
    this.statusCode = statusCode;
    this.details = details;
    this.timestamp = new Date().toISOString();
  }
}

/**
 * Logs errors appropriately based on environment
 * In production, only logs to error tracking service
 * In development, logs to console with details
 */
export function logError(error, context = {}) {
  const errorInfo = {
    message: error.message,
    type: error.type || ErrorTypes.UNKNOWN,
    stack: error.stack,
    context,
    timestamp: new Date().toISOString(),
  };

  // In development, log to console
  if (process.env.NODE_ENV === 'development') {
    console.error('🔴 Error:', errorInfo);
  }

  // TODO: In production, send to error tracking service (e.g., Sentry, LogRocket)
  // if (process.env.NODE_ENV === 'production') {
  //   sendToErrorTracking(errorInfo);
  // }

  return errorInfo;
}

/**
 * Creates a standardized error response for API routes
 */
export function createErrorResponse(error, statusCode = 500) {
  const isDevelopment = process.env.NODE_ENV === 'development';

  const response = {
    error: {
      message: error.message || 'An unexpected error occurred',
      type: error.type || ErrorTypes.UNKNOWN,
      ...(isDevelopment && { stack: error.stack }),
      ...(error.details && { details: error.details }),
    },
    timestamp: new Date().toISOString(),
  };

  // Log the error
  logError(error, { statusCode });

  return response;
}

/**
 * Wraps async route handlers with error handling
 * Usage: export const GET = withErrorHandler(async (req) => { ... })
 */
export function withErrorHandler(handler) {
  return async (request, context) => {
    try {
      return await handler(request, context);
    } catch (error) {
      const statusCode = error.statusCode || 500;
      const errorResponse = createErrorResponse(error, statusCode);
      
      return new Response(JSON.stringify(errorResponse), {
        status: statusCode,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  };
}

/**
 * Converts common errors to AppError instances
 */
export function normalizeError(error) {
  if (error instanceof AppError) {
    return error;
  }

  // Prisma errors
  if (error.code?.startsWith('P')) {
    return new AppError(
      'Database operation failed',
      ErrorTypes.DATABASE,
      500,
      { code: error.code }
    );
  }

  // Firebase auth errors
  if (error.code?.startsWith('auth/')) {
    return new AppError(
      error.message,
      ErrorTypes.AUTHENTICATION,
      401,
      { code: error.code }
    );
  }

  // Generic error
  return new AppError(
    error.message || 'An unexpected error occurred',
    ErrorTypes.UNKNOWN,
    500
  );
}

/**
 * Safe error message for client-side display
 * Removes sensitive information from error messages
 */
export function getSafeErrorMessage(error) {
  if (error instanceof AppError) {
    return error.message;
  }

  // Don't expose internal error details in production
  if (process.env.NODE_ENV === 'production') {
    return 'An unexpected error occurred. Please try again later.';
  }

  return error.message || 'An unexpected error occurred';
}
