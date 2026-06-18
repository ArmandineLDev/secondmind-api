import type { FastifyInstance } from 'fastify'
import * as invoice from './invoice.controller'

export async function invoiceRoutes(fastify: FastifyInstance) {
  fastify.get('/invoices',     invoice.getAll)
  fastify.post('/invoices',    invoice.create)
  fastify.get('/invoices/:id', invoice.getById)
  fastify.put('/invoices/:id', invoice.update)
  fastify.delete('/invoices/:id', invoice.remove)
}
