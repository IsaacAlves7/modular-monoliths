export class AppError extends Error {
  public readonly statusCode: number
  public readonly code: string
  public readonly isOperational: boolean

  constructor(message: string, statusCode = 500, code = 'INTERNAL_ERROR') {
    super(message)
    this.statusCode = statusCode
    this.code = code
    this.isOperational = true
    Error.captureStackTrace(this, this.constructor)
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    super(
      id ? `${resource} com id '${id}' não encontrado` : `${resource} não encontrado`,
      404,
      'NOT_FOUND'
    )
  }
}

export class ValidationError extends AppError {
  public readonly errors: unknown

  constructor(message: string, errors?: unknown) {
    super(message, 422, 'VALIDATION_ERROR')
    this.errors = errors
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Não autorizado') {
    super(message, 401, 'UNAUTHORIZED')
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Acesso negado') {
    super(message, 403, 'FORBIDDEN')
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT')
  }
}

export class BusinessError extends AppError {
  constructor(message: string) {
    super(message, 400, 'BUSINESS_RULE_VIOLATION')
  }
}
