import type { FastifyInstance } from 'fastify'
import { env } from '@/lib/env'
import { createRateLimiter } from '@/lib/rate-limit'
import { signup } from './signup.controller'

// 15 requêtes par heure et par IP.
//
// Le compteur s'incrémente en `onRequest`, donc **avant** la validation : une
// saisie refusée consomme du quota au même titre qu'une inscription réussie.
// C'est voulu — une requête invalide reste une requête — mais ça impose d'être
// large, sinon quelques fautes de frappe suffisaient à bloquer une personne
// légitime pour une heure. À 5, le cas s'est produit dès le premier essai.
//
// 15 laisse la place à l'erreur humaine tout en plafonnant la création de
// comptes en masse, qui coûterait des lignes en base et des emails Brevo.
//
// Plus permissif en local, comme la règle `/sign-in/email` de `lib/auth.ts` et
// pour la même raison : un passage du dossier Bruno `zz-inscription-manuel`
// consomme une dizaine de requêtes, et le seuil de production le couperait en
// plein milieu.
const signupRateLimit = createRateLimiter({
  window: 3600,
  max: env.NODE_ENV === 'production' ? 15 : 100,
  message: "Trop de tentatives depuis cette adresse. Réessayez dans une heure.",
})

export async function signupRoutes(fastify: FastifyInstance) {
  // Volontairement SANS `authenticate` : c'est la seule route publique en
  // écriture de l'API. Toute autre route ajoutée ici doit déclarer le hook,
  // conformément à la règle posée après l'audit du 2026-07-18.
  fastify.post('/signup', { onRequest: [signupRateLimit] }, signup)
}
