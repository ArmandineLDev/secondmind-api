import fp from 'fastify-plugin'
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { fromNodeHeaders } from 'better-auth/node'
import { auth } from '@/lib/auth'
import { findMember } from '@/db/datamappers/settings.datamapper'

// On récupère le type de retour de getSession pour typer request.session
type Session = NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>

// Rôle du membre dans l'organisation active. Better Auth stocke une chaîne libre
// dans `member.role` ; côté SecondMind seuls ces deux rôles existent — tout autre
// valeur est traitée comme non-owner, par précaution.
export type MemberRole = 'owner' | 'client'

// TypeScript ne connaît pas les propriétés qu'on va ajouter dynamiquement sur request et fastify.
// Cette déclaration de module lui explique ce qui existera après l'enregistrement du plugin.
declare module 'fastify' {
  interface FastifyRequest {
    session: Session
    organizationId: string
    role: MemberRole
  }
  interface FastifyInstance {
    // authenticate sera utilisé comme hook dans les routes protégées :
    // { onRequest: [fastify.authenticate] }
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>
    // Gardes de rôle, à chaîner APRÈS authenticate :
    // { onRequest: [fastify.authenticate, fastify.requireOwner] }
    requireOwner: (request: FastifyRequest, reply: FastifyReply) => Promise<void>
    requireClient: (request: FastifyRequest, reply: FastifyReply) => Promise<void>
  }
}

export default fp(async (fastify: FastifyInstance) => {
  // decorateRequest initialise les propriétés sur chaque objet request avant qu'une requête arrive.
  // Fastify exige cette déclaration préalable avant de les peupler dans un hook.
  // Les valeurs null seront remplacées par les vraies données dans authenticate().
  fastify.decorateRequest('session', null as unknown as Session)
  fastify.decorateRequest('organizationId', '' as string)
  // Défaut le plus restrictif : une route qui oublierait `authenticate` ne peut
  // pas hériter par accident des droits d'un owner.
  fastify.decorateRequest('role', 'client' as MemberRole)

  // decorate expose authenticate sur l'instance Fastify elle-même.
  // Chaque route protégée le déclarera comme hook onRequest — il s'exécutera
  // avant le handler et coupera la requête avec un 401/403 si la session est invalide.
  fastify.decorate(
    'authenticate',
    async (request: FastifyRequest, reply: FastifyReply) => {
      // Même en-tête d'IP de confiance que dans le proxy `/auth/*` : ces appels
      // ne passent pas par lui, et sans cela Better Auth ne résoudrait aucune IP
      // ici (`advanced.ipAddress.ipAddressHeaders` ne lit que cet en-tête).
      const headers = fromNodeHeaders(request.headers)
      headers.set('x-secondmind-client-ip', request.ip)

      const session = await auth.api.getSession({ headers })

      // Pas de session = utilisateur non connecté
      if (!session) {
        return reply.status(401).send({ error: 'Non autorisé', status: 401 })
      }

      // Pas d'organisation active = utilisateur connecté mais sans workspace
      // (ne devrait pas arriver en Phase 1, mais on protège quand même)
      if (!session.session.activeOrganizationId) {
        return reply.status(403).send({ error: 'Aucun workspace actif', status: 403 })
      }

      const organizationId = session.session.activeOrganizationId

      // Le rôle est relu en base à chaque requête plutôt que porté par la session :
      // révoquer un accès client doit prendre effet immédiatement, sans attendre
      // l'expiration de sa session. Lecture indexée sur la contrainte unique
      // (userId, organizationId) — cf. migration auth_0002.
      const member = await findMember(session.user.id, organizationId)
      if (!member) {
        // Session valide mais plus aucune adhésion : accès révoqué entre-temps.
        return reply.status(403).send({ error: 'Accès révoqué', status: 403 })
      }

      // On peuple request pour que tous les controllers y accèdent sans rappeler Better Auth
      request.session = session
      request.organizationId = organizationId
      request.role = member.role === 'owner' ? 'owner' : 'client'
    }
  )

  // Réservé à l'owner du workspace : toutes les routes métier /api/v1.
  // Sans cette garde, un client invité — membre de la MÊME organisation — voyait
  // et modifiait l'intégralité des données (CA, contacts, factures…), puisque les
  // datamappers ne filtrent que sur organization_id.
  fastify.decorate(
    'requireOwner',
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (request.role !== 'owner') {
        return reply.status(403).send({ error: 'Réservé au propriétaire du workspace', status: 403 })
      }
    }
  )

  // Réservé aux clients invités : routes /client/*.
  // L'owner n'a rien à y faire (aucun projet ne lui est « assigné » à lui-même) ;
  // le lui refuser explicitement évite de laisser croire que ces routes sont vides.
  fastify.decorate(
    'requireClient',
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (request.role !== 'client') {
        return reply.status(403).send({ error: 'Réservé aux accès clients', status: 403 })
      }
    }
  )
})
