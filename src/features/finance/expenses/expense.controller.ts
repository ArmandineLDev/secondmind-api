import type { FastifyRequest, FastifyReply } from 'fastify'
import { createExpenseSchema, updateExpenseSchema, expenseParamsSchema, expenseQuerySchema } from './expense.schema'
import * as dm from '@/db/datamappers/expense.datamapper'

export async function getAll(req: FastifyRequest, reply: FastifyReply) {
  const query = expenseQuerySchema.parse(req.query)
  reply.send(await dm.findAllExpenses(req.organizationId, query))
}

export async function getById(req: FastifyRequest, reply: FastifyReply) {
  const { id } = expenseParamsSchema.parse(req.params)
  const expense = await dm.findExpenseById(id, req.organizationId)
  if (!expense) return reply.notFound('Dépense introuvable')
  reply.send(expense)
}

export async function create(req: FastifyRequest, reply: FastifyReply) {
  const input = createExpenseSchema.parse(req.body)
  reply.code(201).send(await dm.createExpense(req.organizationId, input))
}

export async function update(req: FastifyRequest, reply: FastifyReply) {
  const { id } = expenseParamsSchema.parse(req.params)
  const input = updateExpenseSchema.parse(req.body)
  const expense = await dm.updateExpense(id, req.organizationId, input)
  if (!expense) return reply.notFound('Dépense introuvable')
  reply.send(expense)
}

export async function remove(req: FastifyRequest, reply: FastifyReply) {
  const { id } = expenseParamsSchema.parse(req.params)
  if (!await dm.deleteExpense(id, req.organizationId)) return reply.notFound('Dépense introuvable')
  reply.code(204).send()
}
