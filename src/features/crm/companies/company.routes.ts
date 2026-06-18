import type { FastifyInstance } from 'fastify'
import * as company from './company.controller'

export async function companyRoutes(fastify: FastifyInstance) {
  fastify.get('/companies',     company.getAll)
  fastify.post('/companies',    company.create)
  fastify.get('/companies/:id', company.getById)
  fastify.put('/companies/:id', company.update)
  fastify.delete('/companies/:id', company.remove)
}
