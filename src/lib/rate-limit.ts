import type { FastifyRequest, FastifyReply } from 'fastify'

/**
 * Limiteur de débit minimal, en mémoire, pour les routes publiques que nous
 * servons nous-mêmes.
 *
 * Better Auth embarque son propre limiteur (cf. `lib/auth.ts`), mais il ne
 * s'applique qu'à ses routes `/api/auth/*`. Une route publique écrite ici —
 * l'inscription — n'en bénéficie pas : sans garde-fou, elle permettrait de créer
 * des comptes en masse et d'épuiser le quota d'emails transactionnels.
 *
 * ⚠️ Mêmes limites que le limiteur de Better Auth, et pour la même raison :
 * l'état vit dans la mémoire du process. Les compteurs repartent à zéro à chaque
 * redéploiement, et deux instances de l'API compteraient chacune de leur côté.
 * Acceptable tant qu'un seul conteneur tourne ; le jour où ce ne sera plus le
 * cas, il faudra un stockage partagé — pour celui-ci comme pour celui de Better
 * Auth, qui aura le même besoin au même moment.
 */
interface Counter {
  count:      number
  resetAt:    number
}

export interface RateLimitOptions {
  /** Durée de la fenêtre, en secondes. */
  window: number
  /** Nombre de requêtes autorisées dans la fenêtre. */
  max: number
  /** Message renvoyé une fois la limite atteinte. */
  message?: string
}

export function createRateLimiter({ window, max, message }: RateLimitOptions) {
  const counters = new Map<string, Counter>()
  const windowMs = window * 1000

  // Purge paresseuse : on nettoie en passant plutôt qu'avec un timer, pour ne pas
  // garder le process éveillé ni laisser la Map croître avec les IP éphémères.
  function sweep(now: number) {
    for (const [key, counter] of counters) {
      if (counter.resetAt <= now) counters.delete(key)
    }
  }

  return async function rateLimit(request: FastifyRequest, reply: FastifyReply) {
    const now = new Date().getTime()
    if (counters.size > 1000) sweep(now)

    // `request.ip` est résolu par Fastify avec `trustProxy: 1` : c'est l'IP vue
    // par Traefik, non forgeable par le client (cf. app.ts).
    const key = request.ip
    const counter = counters.get(key)

    if (!counter || counter.resetAt <= now) {
      counters.set(key, { count: 1, resetAt: now + windowMs })
      return
    }

    if (counter.count >= max) {
      const retryAfter = Math.ceil((counter.resetAt - now) / 1000)
      reply.header('Retry-After', String(retryAfter))
      request.log.warn({ ip: key, url: request.url }, 'Limite de débit atteinte')
      return reply.status(429).send({
        error: message ?? 'Trop de tentatives. Réessayez dans quelques minutes.',
        status: 429,
      })
    }

    counter.count += 1
  }
}
