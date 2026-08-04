import type { FastifyInstance } from 'fastify'
import * as company from './company.controller'

export async function companyRoutes(fastify: FastifyInstance) {
  // Routes métier : réservées à l'owner du workspace (cf. auth.plugin.ts).
  const auth = { onRequest: [fastify.authenticate, fastify.requireOwner] }

  fastify.get('/companies', auth,     company.getAll)
  fastify.post('/companies', auth,    company.create)
  fastify.get('/companies/:id', auth, company.getById)
  fastify.get('/companies/:id/revenue-summary', auth, company.getRevenueSummary)
  fastify.get('/companies/:id/projects', auth, company.getProjects)
  fastify.put('/companies/:id', auth, company.update)
  fastify.delete('/companies/:id', auth, company.remove)
}
