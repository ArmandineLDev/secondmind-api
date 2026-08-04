import type { FastifyInstance } from 'fastify'
import * as budget from './budget.controller'

export async function budgetRoutes(fastify: FastifyInstance) {
  // Routes métier : réservées à l'owner du workspace (cf. auth.plugin.ts).
  const auth = { onRequest: [fastify.authenticate, fastify.requireOwner] }

  fastify.get('/projects/:projectId/budget', auth,    budget.getByProject)
  fastify.put('/projects/:projectId/budget', auth,    budget.upsert)
  fastify.delete('/projects/:projectId/budget', auth, budget.remove)
}
