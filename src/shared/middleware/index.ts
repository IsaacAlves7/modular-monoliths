import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { ZodSchema } from 'zod'
import { AppError, UnauthorizedError, ForbiddenError, ValidationError } from '../errors'
import { JwtPayload, failure } from '../types'
import { config } from '../../config'
import { logger } from '../utils/logger'

// ─── Error Handler ────────────────────────────────────────────────────────────
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError && err.isOperational) {
    const body: Record<string, unknown> = {
      success: false,
      code: err.code,
      message: err.message,
    }
    if (err instanceof ValidationError && err.errors) {
      body.errors = err.errors
    }
    res.status(err.statusCode).json(body)
    return
  }

  // Unexpected errors
  logger.error('Unhandled error', { error: err.message, stack: err.stack, path: req.path })
  res.status(500).json(failure('Erro interno do servidor.'))
}

// ─── Not Found Handler ────────────────────────────────────────────────────────
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json(failure(`Rota '${req.method} ${req.path}' não encontrada.`))
}

// ─── Auth Middleware ──────────────────────────────────────────────────────────
export interface AuthRequest extends Request {
  user?: JwtPayload
}

export function authenticate(req: AuthRequest, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return next(new UnauthorizedError('Token não fornecido.'))
  }

  const token = authHeader.split(' ')[1]
  try {
    const payload = jwt.verify(token, config.JWT_SECRET) as JwtPayload
    req.user = payload
    next()
  } catch {
    next(new UnauthorizedError('Token inválido ou expirado.'))
  }
}

export function authorize(...roles: string[]) {
  return (req: AuthRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) return next(new UnauthorizedError())
    if (!roles.includes(req.user.role)) {
      return next(new ForbiddenError(`Requer role: ${roles.join(' ou ')}`))
    }
    next()
  }
}

// ─── Zod Validation Middleware ────────────────────────────────────────────────
export function validate(schema: ZodSchema, source: 'body' | 'query' | 'params' = 'body') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[source])
    if (!result.success) {
      const formatted = result.error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }))
      return next(new ValidationError('Dados inválidos.', formatted))
    }
    req[source] = result.data
    next()
  }
}

// ─── Request Logger ───────────────────────────────────────────────────────────
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now()
  res.on('finish', () => {
    const duration = Date.now() - start
    logger.info(`${req.method} ${req.path} ${res.statusCode} ${duration}ms`, {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration,
    })
  })
  next()
}
