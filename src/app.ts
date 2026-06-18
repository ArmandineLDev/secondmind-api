import Fastify from 'fastify'
import { db } from '@/lib/db'
import { env } from '@/lib/env'
import corsPlugin from '@/plugins/cors.plugin'
import sensiblePlugin from '@/plugins/sensible.plugin'
import authPlugin from '@/plugins/auth.plugin'
import multipartPlugin from '@/plugins/multipart.plugin'
import { registerRoutes } from '@/routes'

export const buildApp = async () => {
  const app = Fastify({ logger: true })

  app.addHook('onClose', async () => {
    await db.end()
  })

  await app.register(corsPlugin)
  await app.register(sensiblePlugin)
  await app.register(authPlugin)
  await app.register(multipartPlugin)
  await app.register(registerRoutes)

  app.get('/health', async () => {
    return { status: 'ok' }
  })

  return app
}
