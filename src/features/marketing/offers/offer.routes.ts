import type { FastifyInstance } from 'fastify'
import * as offer from './offer.controller'

export async function offerRoutes(fastify: FastifyInstance) {
  fastify.get('/offers',     offer.getAll)
  fastify.post('/offers',    offer.create)
  fastify.get('/offers/:id', offer.getById)
  fastify.put('/offers/:id', offer.update)
  fastify.delete('/offers/:id', offer.remove)
}
