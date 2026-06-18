import type { FastifyInstance } from 'fastify'
import * as lead from './lead.controller'

export async function leadRoutes(fastify: FastifyInstance) {
  fastify.get('/leads',     lead.getAll)
  fastify.post('/leads',    lead.create)
  fastify.get('/leads/:id', lead.getById)
  fastify.put('/leads/:id', lead.update)
  fastify.delete('/leads/:id', lead.remove)
}
