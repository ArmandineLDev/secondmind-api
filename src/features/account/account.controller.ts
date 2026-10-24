import type { FastifyRequest, FastifyReply } from 'fastify'
import * as dm from '@/db/datamappers/account.datamapper'

/**
 * Export des données du compte connecté — RGPD art. 15 et 20.
 *
 * Contrairement à l'export d'une fiche contact, la personne exporte ici **ses
 * propres** données : pas d'identifiant en paramètre, la cible est toujours la
 * session en cours. C'est ce qui rend la route sûre sans contrôle d'accès
 * supplémentaire — on ne peut pas exporter le compte d'un autre.
 */

const OWNER_NOTICE =
  "Export de l'ensemble des données de votre compte et des espaces de travail dont vous êtes "
  + 'propriétaire (RGPD, droit d\'accès et de portabilité). Les mots de passe et jetons '
  + "d'authentification sont volontairement exclus : ce sont des secrets, pas des données à "
  + 'restituer. Les fichiers déposés ne sont pas inclus dans ce JSON — ils se téléchargent '
  + 'depuis le module Documents.'

const CLIENT_NOTICE =
  "Export des données de votre compte (RGPD, droit d'accès et de portabilité). Les documents "
  + 'qui vous sont adressés sont listés à titre informatif : ils appartiennent à l\'activité de '
  + "l'entreprise qui vous a invité, et se téléchargent depuis l'application. Pour toute demande "
  + 'portant sur les informations que cette entreprise détient sur vous, adressez-vous à elle : '
  + "Estaple n'en est que l'hébergeur technique."

export async function exportData(req: FastifyRequest, reply: FastifyReply) {
  const userId = req.session.user.id

  const data = req.role === 'owner'
    ? await dm.exportOwnerData(userId)
    : await dm.exportClientData(userId)

  // Le compte vient d'être supprimé alors que la session tenait encore.
  if (!data) return reply.notFound('Compte introuvable')

  const date = new Date().toISOString().slice(0, 10)

  reply
    .header('Content-Disposition', `attachment; filename="estaple-mes-donnees-${date}.json"`)
    .type('application/json')
    .send({
      exported_at: new Date().toISOString(),
      notice: req.role === 'owner' ? OWNER_NOTICE : CLIENT_NOTICE,
      ...data,
    })
}
