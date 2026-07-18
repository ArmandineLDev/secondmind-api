import type { FastifyInstance } from 'fastify'
import * as revenue from './revenue.controller'

export async function revenueRoutes(fastify: FastifyInstance) {
  const auth = { onRequest: [fastify.authenticate] }

  fastify.get('/revenues', auth,     revenue.getAll)
  fastify.post('/revenues', auth,    revenue.create)
  fastify.get('/revenues/:id', auth, revenue.getById)
  fastify.put('/revenues/:id', auth, revenue.update)
  fastify.delete('/revenues/:id', auth, revenue.remove)
}
