import type { FastifyInstance } from 'fastify'
import * as expense from './expense.controller'

export async function expenseRoutes(fastify: FastifyInstance) {
  fastify.get('/expenses',     expense.getAll)
  fastify.post('/expenses',    expense.create)
  fastify.get('/expenses/:id', expense.getById)
  fastify.put('/expenses/:id', expense.update)
  fastify.delete('/expenses/:id', expense.remove)
}
