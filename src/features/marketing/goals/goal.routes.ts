import type { FastifyInstance } from 'fastify'
import * as goal from './goal.controller'

export async function goalRoutes(fastify: FastifyInstance) {
  const auth = { onRequest: [fastify.authenticate] }

  fastify.get('/goals', auth,     goal.getAll)
  fastify.post('/goals', auth,    goal.create)
  fastify.get('/goals/:id', auth, goal.getById)
  fastify.put('/goals/:id', auth, goal.update)
  fastify.delete('/goals/:id', auth, goal.remove)
}
