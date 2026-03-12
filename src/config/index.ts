import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV:        z.enum(['development', 'production', 'test']).default('development'),
  PORT:            z.coerce.number().default(3000),
  GATEWAY_PORT:    z.coerce.number().default(8080),
  DATABASE_URL:    z.string().min(1),
  JWT_SECRET:      z.string().min(32).default('super-secret-jwt-key-change-in-production!!'),
  JWT_EXPIRES_IN:  z.string().default('15m'),
  REFRESH_SECRET:  z.string().min(32).default('super-secret-refresh-key-change-in-production!'),
  REFRESH_EXPIRES_IN: z.string().default('7d'),
  LOG_LEVEL:       z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  LOG_QUERIES:     z.string().default('false'),
  RATE_LIMIT_WINDOW_MS:  z.coerce.number().default(15 * 60 * 1000),
  RATE_LIMIT_MAX:        z.coerce.number().default(100),
  CORS_ORIGIN:     z.string().default('*'),
})

function loadConfig() {
  const result = envSchema.safeParse(process.env)
  if (!result.success) {
    console.error('❌ Invalid environment variables:')
    console.error(result.error.format())
    process.exit(1)
  }
  return result.data
}

export const config = loadConfig()
export type Config = typeof config
