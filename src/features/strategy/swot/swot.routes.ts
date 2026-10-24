import type { FastifyInstance } from 'fastify'
import * as swot from './swot.controller'

export async function swotRoutes(fastify: FastifyInstance) {
  // Routes métier : réservées à l'owner du workspace (cf. auth.plugin.ts).
  const auth = { onRequest: [fastify.authenticate, fastify.requireOwner] }

  fastify.get('/swots', auth,     swot.getAll)
  fastify.post('/swots', auth,    swot.create)
  fastify.get('/swots/:id', auth, swot.getById)
  fastify.put('/swots/:id', auth, swot.update)
  fastify.delete('/swots/:id', auth, swot.remove)
}
