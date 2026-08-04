import { FastifyInstance } from 'fastify'
import { fromNodeHeaders } from 'better-auth/node'
import { auth } from '@/lib/auth'

export async function authRoutes(fastify: FastifyInstance) {
  // Retourne la session courante — utilisé par le frontend pour savoir si l'utilisateur est connecté
  fastify.get('/me', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    return reply.send(request.session)
  })

  // Proxy vers Better Auth — gère sign-in, sign-out, et toutes les routes internes de Better Auth
  fastify.route({
    method: ['GET', 'POST'],
    url: '/auth/*',
    async handler(request, reply) {
      const url = new URL(request.url, `${request.protocol}://${request.headers.host}`)
      const headers = fromNodeHeaders(request.headers)

      // IP client de confiance pour le rate-limiting de Better Auth.
      // Better Auth lit `x-forwarded-for` et en prend la PREMIÈRE valeur ; or
      // Traefik ajoute la vraie IP à la suite de ce que le client a envoyé.
      // Un attaquant forgeant cet en-tête ferait donc varier sa clé de limitation
      // à volonté et passerait au travers. `request.ip` est résolu par Fastify
      // avec `trustProxy: 1` (cf. app.ts) : c'est l'IP vue par Traefik, non forgeable.
      // `set` écrase toute valeur homonyme envoyée par le client.
      headers.set('x-secondmind-client-ip', request.ip)

      const req = new Request(url.toString(), {
        method: request.method,
        headers,
        ...(request.body ? { body: JSON.stringify(request.body) } : {}),
      })

      const response = await auth.handler(req)

      reply.status(response.status)
      response.headers.forEach((value, key) => reply.header(key, value))
      return reply.send(response.body ? await response.text() : null)
    },
  })
}
