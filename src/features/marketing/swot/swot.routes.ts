import type { FastifyInstance } from 'fastify'
import * as swot from './swot.controller'

export async function swotRoutes(fastify: FastifyInstance) {
  const auth = { onRequest: [fastify.authenticate] }

  fastify.get('/swots', auth,     swot.getAll)
  fastify.post('/swots', auth,    swot.create)
  fastify.get('/swots/:id', auth, swot.getById)
  fastify.put('/swots/:id', auth, swot.update)
  fastify.delete('/swots/:id', auth, swot.remove)
}
