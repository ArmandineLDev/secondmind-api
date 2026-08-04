import type { FastifyInstance } from 'fastify'
import * as expense from './expense.controller'

export async function expenseRoutes(fastify: FastifyInstance) {
  // Routes métier : réservées à l'owner du workspace (cf. auth.plugin.ts).
  const auth = { onRequest: [fastify.authenticate, fastify.requireOwner] }

  fastify.get('/expenses', auth,     expense.getAll)
  fastify.post('/expenses', auth,    expense.create)
  fastify.get('/expenses/:id', auth, expense.getById)
  fastify.put('/expenses/:id', auth, expense.update)
  fastify.delete('/expenses/:id', auth, expense.remove)
}
