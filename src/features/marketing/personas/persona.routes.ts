import type { FastifyInstance } from 'fastify'
import * as persona from './persona.controller'

export async function personaRoutes(fastify: FastifyInstance) {
  fastify.get('/personas',     persona.getAll)
  fastify.post('/personas',    persona.create)
  fastify.get('/personas/:id', persona.getById)
  fastify.put('/personas/:id', persona.update)
  fastify.delete('/personas/:id', persona.remove)
}
