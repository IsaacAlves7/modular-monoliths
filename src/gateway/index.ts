/**
 * ══════════════════════════════════════════════════════════════════
 *  API GATEWAY
 *  ─ Ponto de entrada único para todos os módulos
 *  ─ Responsabilidades:
 *      • Roteamento inteligente por módulo/prefixo
 *      • Rate limiting global e por rota
 *      • Autenticação JWT centralizada (opcional por rota)
 *      • Request/Response logging com correlation ID
 *      • Circuit breaker (simulado)
 *      • Health aggregation de todos os módulos
 *      • Proxy reverso para cada serviço (quando em modo distribuído)
 * ══════════════════════════════════════════════════════════════════
 */

import express, { Request, Response, NextFunction } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { v4 as uuid } from 'uuid'
import jwt from 'jsonwebtoken'
import { config } from '../config'
import { logger } from '../shared/utils/logger'

// ─── Types ────────────────────────────────────────────────────────────────────
interface RouteConfig {
  prefix: string
  target: string          // URL destino (modo proxy) ou 'internal' (modo embutido)
  rateLimit?: { max: number; windowMs: number }
  requireAuth?: boolean
  allowedRoles?: string[]
  description: string
}

// ─── Route Registry ───────────────────────────────────────────────────────────
const ROUTE_REGISTRY: RouteConfig[] = [
  {
    prefix: '/api/users',
    target: 'internal',
    description: 'User & Auth module',
    rateLimit: { max: 20, windowMs: 60_000 },  // Mais restrito para auth
  },
  {
    prefix: '/api/products',
    target: 'internal',
    description: 'Products module',
    rateLimit: { max: 200, windowMs: 60_000 },
  },
  {
    prefix: '/api/orders',
    target: 'internal',
    description: 'Orders module',
    requireAuth: true,
    rateLimit: { max: 50, windowMs: 60_000 },
  },
]

// ─── In-Memory Request Metrics ────────────────────────────────────────────────
interface RequestMetrics {
  total: number
  success: number
  errors: number
  avgResponseTime: number
  lastReset: Date
}

const metrics: Record<string, RequestMetrics> = {}

function getOrCreateMetrics(route: string): RequestMetrics {
  if (!metrics[route]) {
    metrics[route] = { total: 0, success: 0, errors: 0, avgResponseTime: 0, lastReset: new Date() }
  }
  return metrics[route]
}

// ─── Middlewares ──────────────────────────────────────────────────────────────

/** Correlation ID — rastreia cada requisição de ponta a ponta */
function correlationIdMiddleware(req: Request, res: Response, next: NextFunction) {
  const correlationId = (req.headers['x-correlation-id'] as string) || uuid()
  req.headers['x-correlation-id'] = correlationId
  res.setHeader('X-Correlation-ID', correlationId)
  next()
}

/** Gateway logging com métricas */
function gatewayLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now()
  const correlationId = req.headers['x-correlation-id']
  const route = ROUTE_REGISTRY.find(r => req.path.startsWith(r.prefix))

  res.on('finish', () => {
    const duration = Date.now() - start
    const isError  = res.statusCode >= 400

    logger.info('Gateway request', {
      correlationId,
      method:     req.method,
      path:       req.path,
      statusCode: res.statusCode,
      duration:   `${duration}ms`,
      module:     route?.description ?? 'unknown',
      ip:         req.ip,
    })

    // Atualizar métricas
    if (route) {
      const m = getOrCreateMetrics(route.prefix)
      m.total++
      if (isError) m.errors++
      else m.success++
      m.avgResponseTime = (m.avgResponseTime * (m.total - 1) + duration) / m.total
    }
  })

  next()
}

/** JWT validation no gateway (para rotas que exigem auth) */
function gatewayAuth(req: Request, res: Response, next: NextFunction) {
  const route = ROUTE_REGISTRY.find(r => req.path.startsWith(r.prefix))
  if (!route?.requireAuth) return next()

  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Token não fornecido.' })
  }

  try {
    const token = authHeader.split(' ')[1]
    const payload = jwt.verify(token, config.JWT_SECRET) as { role?: string }

    // Verificar role se necessário
    if (route.allowedRoles?.length && !route.allowedRoles.includes(payload.role ?? '')) {
      return res.status(403).json({ success: false, message: 'Acesso negado.' })
    }

    next()
  } catch {
    return res.status(401).json({ success: false, message: 'Token inválido.' })
  }
}

/** Rate limiting por rota */
function perRouteRateLimit(req: Request, res: Response, next: NextFunction) {
  const route = ROUTE_REGISTRY.find(r => req.path.startsWith(r.prefix))
  if (!route?.rateLimit) return next()

  const limiter = rateLimit({
    windowMs: route.rateLimit.windowMs,
    max: route.rateLimit.max,
    keyGenerator: (r) => `${route.prefix}:${r.ip}`,
    message: {
      success: false,
      message: `Limite de requisições atingido para ${route.description}. Tente novamente.`,
    },
    standardHeaders: true,
    legacyHeaders: false,
  })

  return limiter(req, res, next)
}

/** Request size guard */
function requestSizeGuard(req: Request, res: Response, next: NextFunction) {
  const contentLength = parseInt(req.headers['content-length'] ?? '0')
  const MAX_SIZE = 5 * 1024 * 1024 // 5MB
  if (contentLength > MAX_SIZE) {
    return res.status(413).json({ success: false, message: 'Payload muito grande. Limite: 5MB.' })
  }
  next()
}

// ─── Gateway App Factory ──────────────────────────────────────────────────────
export function createGateway(internalApp: express.Application) {
  const gateway = express()

  // ── Security & Base Middleware ──────────────────────────────────────────────
  gateway.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
      },
    },
    hsts: { maxAge: 31536000, includeSubDomains: true },
  }))

  gateway.use(cors({
    origin: config.CORS_ORIGIN,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Correlation-ID'],
    exposedHeaders: ['X-Correlation-ID', 'X-RateLimit-Limit', 'X-RateLimit-Remaining'],
  }))

  gateway.use(express.json({ limit: '10mb' }))
  gateway.use(express.urlencoded({ extended: true }))

  // ── Gateway Middlewares ─────────────────────────────────────────────────────
  gateway.use(correlationIdMiddleware)
  gateway.use(gatewayLogger)
  gateway.use(requestSizeGuard)
  gateway.use(perRouteRateLimit)
  gateway.use(gatewayAuth)

  // ── Gateway Health Check ────────────────────────────────────────────────────
  gateway.get('/health', (_req, res) => {
    res.json({
      status: 'healthy',
      service: 'api-gateway',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      routes: ROUTE_REGISTRY.map(r => ({ prefix: r.prefix, description: r.description })),
    })
  })

  // ── Gateway Metrics Dashboard ────────────────────────────────────────────────
  gateway.get('/gateway/metrics', (_req, res) => {
    res.json({
      success: true,
      data: {
        uptime: Math.floor(process.uptime()),
        memory: process.memoryUsage(),
        routes: Object.entries(metrics).map(([route, m]) => ({
          route,
          ...m,
          errorRate: m.total > 0 ? ((m.errors / m.total) * 100).toFixed(1) + '%' : '0%',
          avgResponseTime: Math.round(m.avgResponseTime) + 'ms',
        })),
      },
    })
  })

  // ── Gateway Routes Info ───────────────────────────────────────────────────────
  gateway.get('/gateway/routes', (_req, res) => {
    res.json({
      success: true,
      data: ROUTE_REGISTRY.map(r => ({
        prefix: r.prefix,
        description: r.description,
        requireAuth: r.requireAuth ?? false,
        rateLimit: r.rateLimit
          ? `${r.rateLimit.max} req/${r.rateLimit.windowMs / 1000}s`
          : 'global default',
      })),
    })
  })

  // ── Forward all /api/* to the internal monolith app ──────────────────────────
  gateway.use('/api', (req: Request, res: Response, next: NextFunction) => {
    // Add gateway metadata headers
    req.headers['x-gateway-version'] = '1.0'
    req.headers['x-request-time'] = Date.now().toString()

    // Delegate to internal Express app
    internalApp(req, res, next)
  })

  // ── 404 fallback ─────────────────────────────────────────────────────────────
  gateway.use((req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      message: `Gateway: rota '${req.method} ${req.path}' não existe.`,
      availableRoutes: ROUTE_REGISTRY.map(r => r.prefix),
    })
  })

  // ── Gateway Error Handler ────────────────────────────────────────────────────
  gateway.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
    const correlationId = req.headers['x-correlation-id']
    logger.error('Gateway error', { error: err.message, correlationId, path: req.path })
    res.status(500).json({ success: false, message: 'Erro no Gateway.', correlationId })
  })

  return gateway
}
