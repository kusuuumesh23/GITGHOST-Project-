export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(statusCode: number, message: string, code: string = 'API_ERROR', details?: unknown) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequestError extends ApiError {
  constructor(message: string = 'Bad request', details?: unknown) {
    super(400, message, 'BAD_REQUEST', details);
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message: string = 'Unauthorized', details?: unknown) {
    super(401, message, 'UNAUTHORIZED', details);
  }
}

export class ForbiddenError extends ApiError {
  constructor(message: string = 'Forbidden', details?: unknown) {
    super(403, message, 'FORBIDDEN', details);
  }
}

export class NotFoundError extends ApiError {
  constructor(message: string = 'Resource not found', details?: unknown) {
    super(404, message, 'NOT_FOUND', details);
  }
}

export class ConflictError extends ApiError {
  constructor(message: string = 'Resource conflict', details?: unknown) {
    super(409, message, 'CONFLICT', details);
  }
}

export class ValidationError extends ApiError {
  constructor(message: string = 'Validation failed', details?: unknown) {
    super(422, message, 'VALIDATION_ERROR', details);
  }
}

export class RateLimitError extends ApiError {
  constructor(message: string = 'Too many requests, please try again later', details?: unknown) {
    super(429, message, 'RATE_LIMIT_EXCEEDED', details);
  }
}

export class InternalServerError extends ApiError {
  constructor(message: string = 'Internal server error', details?: unknown) {
    super(500, message, 'INTERNAL_SERVER_ERROR', details);
  }
}
