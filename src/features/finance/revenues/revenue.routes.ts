import type { FastifyInstance } from 'fastify'
import * as revenue from './revenue.controller'

export async function revenueRoutes(fastify: FastifyInstance) {
  fastify.get('/revenues',     revenue.getAll)
  fastify.post('/revenues',    revenue.create)
  fastify.get('/revenues/:id', revenue.getById)
  fastify.put('/revenues/:id', revenue.update)
  fastify.delete('/revenues/:id', revenue.remove)
}
