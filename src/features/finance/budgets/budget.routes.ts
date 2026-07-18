import type { FastifyInstance } from 'fastify'
import * as budget from './budget.controller'

export async function budgetRoutes(fastify: FastifyInstance) {
  const auth = { onRequest: [fastify.authenticate] }

  fastify.get('/projects/:projectId/budget', auth,    budget.getByProject)
  fastify.put('/projects/:projectId/budget', auth,    budget.upsert)
  fastify.delete('/projects/:projectId/budget', auth, budget.remove)
}
