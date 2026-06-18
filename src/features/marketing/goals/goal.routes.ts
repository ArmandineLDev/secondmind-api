import type { FastifyInstance } from 'fastify'
import * as goal from './goal.controller'

export async function goalRoutes(fastify: FastifyInstance) {
  fastify.get('/goals',     goal.getAll)
  fastify.post('/goals',    goal.create)
  fastify.get('/goals/:id', goal.getById)
  fastify.put('/goals/:id', goal.update)
  fastify.delete('/goals/:id', goal.remove)
}
