import type { FastifyInstance } from 'fastify'
import * as budget from './budget.controller'

export async function budgetRoutes(fastify: FastifyInstance) {
  fastify.get('/projects/:projectId/budget',    budget.getByProject)
  fastify.put('/projects/:projectId/budget',    budget.upsert)
  fastify.delete('/projects/:projectId/budget', budget.remove)
}
