import Fastify from 'fastify'
import { db } from '@/lib/db'
import { env } from '@/lib/env'
import corsPlugin from '@/plugins/cors.plugin'
import sensiblePlugin from '@/plugins/sensible.plugin'
import errorHandlerPlugin from '@/plugins/error-handler.plugin'
import authPlugin from '@/plugins/auth.plugin'
import multipartPlugin from '@/plugins/multipart.plugin'
import { registerRoutes } from '@/routes'

export const buildApp = async () => {
  const app = Fastify({
    logger: true,
    // Un seul proxy devant l'API en production : Traefik (Coolify).
    // `trustProxy: 1` fait résoudre `request.ip` à partir du DERNIER saut de
    // `x-forwarded-for` — celui ajouté par Traefik — et non du premier, que
    // n'importe quel client peut forger. C'est ce qui rend le rate-limiting
    // non contournable : voir l'injection de `x-secondmind-client-ip` dans
    // `features/auth/auth.routes.ts`.
    // En local il n'y a aucun proxy : `request.ip` vaut simplement 127.0.0.1.
    trustProxy: 1,
  })

  app.addHook('onClose', async () => {
    await db.end()
  })

  await app.register(corsPlugin)
  await app.register(sensiblePlugin)
  // Après sensible (dont il rattrape les erreurs) et avant les routes, pour que
  // le gestionnaire soit posé sur l'instance racine et couvre tout l'arbre.
  await app.register(errorHandlerPlugin)
  await app.register(authPlugin)
  await app.register(multipartPlugin)
  await app.register(registerRoutes)

  app.get('/health', async () => {
    return { status: 'ok' }
  })

  return app
}
