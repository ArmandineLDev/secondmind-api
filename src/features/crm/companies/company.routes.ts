import type { FastifyInstance } from 'fastify'
import * as company from './company.controller'

export async function companyRoutes(fastify: FastifyInstance) {
  const auth = { onRequest: [fastify.authenticate] }

  fastify.get('/companies', auth,     company.getAll)
  fastify.post('/companies', auth,    company.create)
  fastify.get('/companies/:id', auth, company.getById)
  fastify.get('/companies/:id/revenue-summary', auth, company.getRevenueSummary)
  fastify.get('/companies/:id/projects', auth, company.getProjects)
  fastify.put('/companies/:id', auth, company.update)
  fastify.delete('/companies/:id', auth, company.remove)
}
