import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import rateLimit from 'express-rate-limit'
import { config } from './config'
import { errorHandler, notFoundHandler, requestLogger } from './shared/middleware'
import { usersRouter }    from './modules/users/infrastructure/http/users.router'
import { productsRouter } from './modules/products/infrastructure/http/products.router'
import { ordersRouter }   from './modules/orders/infrastructure/http/orders.router'

export function createApp() {
  const app = express()

  // ─── Security ──────────────────────────────────────────────────────────────
  app.use(helmet())
  app.use(cors({ origin: config.CORS_ORIGIN, credentials: true }))

  // ─── Rate Limiting ─────────────────────────────────────────────────────────
  app.use('/api', rateLimit({
    windowMs: config.RATE_LIMIT_WINDOW_MS,
    max: config.RATE_LIMIT_MAX,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Muitas requisições. Tente novamente em instantes.' },
  }))

  // ─── Body Parser ───────────────────────────────────────────────────────────
  app.use(express.json({ limit: '10mb' }))
  app.use(express.urlencoded({ extended: true }))

  // ─── Logging ───────────────────────────────────────────────────────────────
  if (config.NODE_ENV !== 'test') {
    app.use(morgan(config.NODE_ENV === 'production' ? 'combined' : 'dev'))
  }
  app.use(requestLogger)

  // ─── Health Check ──────────────────────────────────────────────────────────
  app.get('/health', (_req, res) => {
    res.json({
      status: 'healthy',
      service: 'modular-monolith',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    })
  })

  // ─── Module Routes ─────────────────────────────────────────────────────────
  app.use('/api/users',    usersRouter)
  app.use('/api/products', productsRouter)
  app.use('/api/orders',   ordersRouter)

  // ─── Error Handling ────────────────────────────────────────────────────────
  app.use(notFoundHandler)
  app.use(errorHandler)

  return app
}
