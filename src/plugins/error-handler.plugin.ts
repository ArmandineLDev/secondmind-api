import fp from 'fastify-plugin'
import { ZodError } from 'zod'
import type { FastifyError, FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'

/**
 * Format d'erreur unique de l'API : `{ error, status }` (convention du CLAUDE.md).
 *
 * Avant ce plugin, deux formats cohabitaient :
 *   · `@fastify/sensible` (reply.badRequest / notFound…) renvoyait le format de
 *     `http-errors` : `{ statusCode, error: "Bad Request", message: "Projet introuvable" }`.
 *     Le front lit `err.error` (cf. `lib/api.ts`) — il affichait donc « Bad Request »
 *     au lieu du vrai message ;
 *   · `auth.plugin.ts` renvoyait déjà `{ error, status }` à la main.
 *
 * Et surtout, les contrôleurs qui utilisent `schema.parse()` (CRM, finance,
 * marketing) laissaient remonter la `ZodError` telle quelle : Fastify la traitait
 * en **500**, avec le détail du schéma dans la réponse. Une simple faute de saisie
 * devenait indiscernable d'un vrai plantage serveur.
 */
export default fp(async (fastify: FastifyInstance) => {
  fastify.setErrorHandler((
    error: FastifyError | ZodError,
    request: FastifyRequest,
    reply: FastifyReply,
  ) => {
    // ── Validation Zod → 400 ────────────────────────────────────────────────
    // Message reconstruit à partir des `issues` : le `message` brut d'une
    // ZodError est un dump JSON illisible pour l'utilisateur final.
    if (error instanceof ZodError) {
      const detail = error.issues
        .map((i) => `${i.path.join('.') || 'corps de la requête'} : ${i.message}`)
        .join(' · ')

      request.log.info(
        { url: request.url, issues: error.issues },
        'Requête refusée : validation',
      )
      return reply.status(400).send({ error: `Données invalides — ${detail}`, status: 400 })
    }

    const status = error.statusCode ?? 500

    // ── Erreurs 4xx volontaires → message conservé ──────────────────────────
    // Ce sont les `reply.badRequest()` / `notFound()` des contrôleurs : leur
    // message est écrit pour l'utilisateur, on le transmet tel quel.
    if (status >= 400 && status < 500) {
      request.log.info({ url: request.url, status }, error.message)
      return reply.status(status).send({ error: error.message, status })
    }

    // ── Tout le reste → 500 opaque ──────────────────────────────────────────
    // Trace complète côté serveur, rien de technique côté client : une erreur
    // PostgreSQL divulguerait noms de tables et de colonnes.
    request.log.error({ err: error, url: request.url }, 'Erreur serveur non gérée')
    return reply.status(500).send({
      error: 'Une erreur interne est survenue. Réessayez ou contactez le support.',
      status: 500,
    })
  })

  // Route inexistante : même format que le reste, plutôt que celui de Fastify.
  fastify.setNotFoundHandler((request, reply) => {
    return reply.status(404).send({
      error: `Route introuvable : ${request.method} ${request.url}`,
      status: 404,
    })
  })
})
