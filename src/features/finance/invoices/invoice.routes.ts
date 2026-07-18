import type { FastifyInstance } from 'fastify'
import * as invoice from './invoice.controller'

export async function invoiceRoutes(fastify: FastifyInstance) {
  const auth = { onRequest: [fastify.authenticate] }

  fastify.get('/invoices', auth,     invoice.getAll)
  fastify.post('/invoices', auth,    invoice.create)
  fastify.get('/invoices/:id', auth, invoice.getById)
  fastify.put('/invoices/:id', auth, invoice.update)
  fastify.delete('/invoices/:id', auth, invoice.remove)
}
