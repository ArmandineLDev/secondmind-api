import type { FastifyInstance } from 'fastify'
import * as persona from './persona.controller'

export async function personaRoutes(fastify: FastifyInstance) {
  const auth = { onRequest: [fastify.authenticate] }

  fastify.get('/personas', auth,     persona.getAll)
  fastify.post('/personas', auth,    persona.create)
  fastify.get('/personas/:id', auth, persona.getById)
  fastify.put('/personas/:id', auth, persona.update)
  fastify.delete('/personas/:id', auth, persona.remove)
}
