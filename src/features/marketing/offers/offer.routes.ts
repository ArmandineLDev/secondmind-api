import type { FastifyInstance } from 'fastify'
import * as offer from './offer.controller'

export async function offerRoutes(fastify: FastifyInstance) {
  const auth = { onRequest: [fastify.authenticate] }

  fastify.get('/offers', auth,     offer.getAll)
  fastify.post('/offers', auth,    offer.create)
  fastify.get('/offers/:id', auth, offer.getById)
  fastify.put('/offers/:id', auth, offer.update)
  fastify.delete('/offers/:id', auth, offer.remove)
}
