import fp from 'fastify-plugin'
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { fromNodeHeaders } from 'better-auth/node'
import { auth } from '@/lib/auth'

// On récupère le type de retour de getSession pour typer request.session
type Session = NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>

// TypeScript ne connaît pas les propriétés qu'on va ajouter dynamiquement sur request et fastify.
// Cette déclaration de module lui explique ce qui existera après l'enregistrement du plugin.
declare module 'fastify' {
  interface FastifyRequest {
    session: Session
    organizationId: string
  }
  interface FastifyInstance {
    // authenticate sera utilisé comme hook dans les routes protégées :
    // { onRequest: [fastify.authenticate] }
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>
  }
}

export default fp(async (fastify: FastifyInstance) => {
  // decorateRequest initialise les propriétés sur chaque objet request avant qu'une requête arrive.
  // Fastify exige cette déclaration préalable avant de les peupler dans un hook.
  // Les valeurs null seront remplacées par les vraies données dans authenticate().
  fastify.decorateRequest('session', null as unknown as Session)
  fastify.decorateRequest('organizationId', '' as string)

  // decorate expose authenticate sur l'instance Fastify elle-même.
  // Chaque route protégée le déclarera comme hook onRequest — il s'exécutera
  // avant le handler et coupera la requête avec un 401/403 si la session est invalide.
  fastify.decorate(
    'authenticate',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await auth.api.getSession({
        headers: fromNodeHeaders(request.headers),
      })

      // Pas de session = utilisateur non connecté
      if (!session) {
        return reply.status(401).send({ error: 'Non autorisé', status: 401 })
      }

      // Pas d'organisation active = utilisateur connecté mais sans workspace
      // (ne devrait pas arriver en Phase 1, mais on protège quand même)
      if (!session.session.activeOrganizationId) {
        return reply.status(403).send({ error: 'Aucun workspace actif', status: 403 })
      }

      // On peuple request pour que tous les controllers y accèdent sans rappeler Better Auth
      request.session = session
      request.organizationId = session.session.activeOrganizationId
    }
  )
})
