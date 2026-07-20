import type { FastifyInstance } from 'fastify'
import * as opportunity from './opportunity.controller'

export async function opportunityRoutes(fastify: FastifyInstance) {
  const auth = { onRequest: [fastify.authenticate] }

  fastify.get('/opportunities', auth,     opportunity.getAll)
  fastify.post('/opportunities', auth,    opportunity.create)
  fastify.get('/opportunities/:id', auth, opportunity.getById)
  fastify.put('/opportunities/:id', auth, opportunity.update)
  fastify.delete('/opportunities/:id', auth, opportunity.remove)
}
