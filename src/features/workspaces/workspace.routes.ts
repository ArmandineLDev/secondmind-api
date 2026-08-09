import type { FastifyInstance } from 'fastify'
import * as workspace from './workspace.controller'

export async function workspaceRoutes(fastify: FastifyInstance) {
  // ⚠️ `authenticate` SANS `requireOwner`, contrairement au reste de /api/v1 :
  // un client invité doit pouvoir lister ses espaces et en changer, sans quoi
  // quelqu'un appartenant à la fois à son propre workspace et à celui d'un autre
  // resterait prisonnier de celui que la session a choisi à la connexion.
  const auth = { onRequest: [fastify.authenticate] }

  fastify.get('/workspaces', auth, workspace.getAll)
  fastify.post('/workspaces/:id/activate', auth, workspace.activate)
}
