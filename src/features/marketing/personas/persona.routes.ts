import type { FastifyInstance } from 'fastify'
import * as persona from './persona.controller'

export async function personaRoutes(fastify: FastifyInstance) {
  // Routes métier : réservées à l'owner du workspace (cf. auth.plugin.ts).
  const auth = { onRequest: [fastify.authenticate, fastify.requireOwner] }

  fastify.get('/personas', auth,     persona.getAll)
  fastify.post('/personas', auth,    persona.create)
  fastify.get('/personas/:id', auth, persona.getById)
  fastify.put('/personas/:id', auth, persona.update)
  fastify.delete('/personas/:id', auth, persona.remove)
}
