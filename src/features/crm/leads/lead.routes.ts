import type { FastifyInstance } from 'fastify'
import * as lead from './lead.controller'

export async function leadRoutes(fastify: FastifyInstance) {
  const auth = { onRequest: [fastify.authenticate] }

  fastify.get('/leads', auth,     lead.getAll)
  fastify.post('/leads', auth,    lead.create)
  fastify.get('/leads/:id', auth, lead.getById)
  fastify.put('/leads/:id', auth, lead.update)
  fastify.delete('/leads/:id', auth, lead.remove)
}
