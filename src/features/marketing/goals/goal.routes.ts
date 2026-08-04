import type { FastifyInstance } from 'fastify'
import * as goal from './goal.controller'

export async function goalRoutes(fastify: FastifyInstance) {
  // Routes métier : réservées à l'owner du workspace (cf. auth.plugin.ts).
  const auth = { onRequest: [fastify.authenticate, fastify.requireOwner] }

  fastify.get('/goals', auth,     goal.getAll)
  fastify.post('/goals', auth,    goal.create)
  fastify.get('/goals/:id', auth, goal.getById)
  fastify.put('/goals/:id', auth, goal.update)
  fastify.delete('/goals/:id', auth, goal.remove)
}
