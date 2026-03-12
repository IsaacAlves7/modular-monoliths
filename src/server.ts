import { config } from './config'
import { createApp } from './app'
import { createGateway } from './gateway'
import { connectDatabase, disconnectDatabase } from './prisma/client'
import { logger } from './shared/utils/logger'

async function bootstrap() {
  // 1. Connect DB
  await connectDatabase()

  // 2. Create internal app (all modules)
  const internalApp = createApp()

  // 3. Wrap with API Gateway
  const gateway = createGateway(internalApp)

  // 4. Start Gateway server
  const server = gateway.listen(config.GATEWAY_PORT, () => {
    logger.info(`
╔════════════════════════════════════════════════════╗
║          MODULAR MONOLITH — RUNNING                ║
╠════════════════════════════════════════════════════╣
║  🌐 Gateway:   http://localhost:${config.GATEWAY_PORT}           ║
║  📡 API Base:  http://localhost:${config.GATEWAY_PORT}/api       ║
║  ❤️  Health:   http://localhost:${config.GATEWAY_PORT}/health     ║
║  📊 Metrics:  http://localhost:${config.GATEWAY_PORT}/gateway/metrics ║
║  🗺️  Routes:   http://localhost:${config.GATEWAY_PORT}/gateway/routes ║
║  🌿 Env:       ${config.NODE_ENV.padEnd(34)}║
╚════════════════════════════════════════════════════╝
    `)
  })

  // 5. Graceful shutdown
  const gracefulShutdown = async (signal: string) => {
    logger.info(`${signal} received — shutting down gracefully...`)
    server.close(async () => {
      await disconnectDatabase()
      logger.info('Server closed.')
      process.exit(0)
    })

    // Force exit after 10s
    setTimeout(() => {
      logger.error('Could not close connections in time. Forcing exit.')
      process.exit(1)
    }, 10_000)
  }

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
  process.on('SIGINT',  () => gracefulShutdown('SIGINT'))

  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled rejection', { reason })
  })

  process.on('uncaughtException', (err) => {
    logger.error('Uncaught exception', { error: err.message })
    process.exit(1)
  })
}

bootstrap().catch((err) => {
  console.error('Fatal error during bootstrap:', err)
  process.exit(1)
})
