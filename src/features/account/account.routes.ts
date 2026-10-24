import type { FastifyInstance } from 'fastify'
import * as account from './account.controller'

export async function accountRoutes(fastify: FastifyInstance) {
  // ⚠️ `authenticate` SANS `requireOwner`, comme les routes workspaces : le droit
  // d'accès et de portabilité appartient à toute personne concernée, un client
  // invité compris. La route ne lit que la session en cours, jamais un compte
  // désigné en paramètre — il n'y a donc rien à cloisonner de plus.
  const auth = { onRequest: [fastify.authenticate] }

  fastify.get('/account/export', auth, account.exportData)
}
