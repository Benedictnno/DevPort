// DevPort — Typed Application Errors
// All errors should map to an appropriate HTTP status code and be safe to surface to clients.

export class AppError extends Error {
  readonly statusCode: number;
  readonly code: string;
  readonly isOperational: boolean;

  constructor(message: string, statusCode: number, code: string) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  readonly details?: unknown;
  constructor(message: string, details?: unknown) {
    super(message, 400, "VALIDATION_ERROR");
    this.details = details;
  }
}

export class AuthenticationError extends AppError {
  constructor(message = "Authentication required") {
    super(message, 401, "AUTHENTICATION_ERROR");
  }
}

export class AuthorizationError extends AppError {
  constructor(message = "Access denied") {
    super(message, 403, "AUTHORIZATION_ERROR");
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 404, "NOT_FOUND");
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, "CONFLICT");
  }
}

export class RateLimitError extends AppError {
  constructor(message = "Too many requests") {
    super(message, 429, "RATE_LIMIT_EXCEEDED");
  }
}

export class IntegrationError extends AppError {
  readonly provider?: string;
  constructor(message: string, provider?: string) {
    super(message, 502, "INTEGRATION_ERROR");
    this.provider = provider;
  }
}

export class ExternalServiceError extends AppError {
  constructor(message: string) {
    super(message, 503, "EXTERNAL_SERVICE_ERROR");
  }
}

export class InternalError extends AppError {
  constructor(message = "An internal error occurred") {
    super(message, 500, "INTERNAL_ERROR");
  }
}

// Type guard
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

// Build a safe client-facing error response
export function toErrorResponse(error: unknown): {
  error: { code: string; message: string; details?: unknown };
  status: number;
} {
  if (error instanceof ValidationError) {
    return {
      error: { code: error.code, message: error.message, details: error.details },
      status: error.statusCode,
    };
  }
  if (isAppError(error)) {
    return {
      error: { code: error.code, message: error.message },
      status: error.statusCode,
    };
  }
  // Never expose unknown errors to clients
  return {
    error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" },
    status: 500,
  };
}
