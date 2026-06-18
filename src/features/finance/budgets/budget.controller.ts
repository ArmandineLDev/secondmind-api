import type { FastifyRequest, FastifyReply } from 'fastify'
import { upsertBudgetSchema, budgetParamsSchema } from './budget.schema'
import * as dm from '@/db/datamappers/budget.datamapper'

export async function getByProject(req: FastifyRequest, reply: FastifyReply) {
  const { projectId } = budgetParamsSchema.parse(req.params)
  const budget = await dm.findBudgetByProject(projectId)
  if (!budget) return reply.notFound('Budget introuvable')
  reply.send(budget)
}

export async function upsert(req: FastifyRequest, reply: FastifyReply) {
  const { projectId } = budgetParamsSchema.parse(req.params)
  const input = upsertBudgetSchema.parse(req.body)
  reply.send(await dm.upsertBudget(projectId, input))
}

export async function remove(req: FastifyRequest, reply: FastifyReply) {
  const { projectId } = budgetParamsSchema.parse(req.params)
  if (!await dm.deleteBudget(projectId)) return reply.notFound('Budget introuvable')
  reply.code(204).send()
}
