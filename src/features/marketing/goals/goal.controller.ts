import type { FastifyRequest, FastifyReply } from 'fastify'
import {
  createGoalSchema,
  updateGoalSchema,
  goalParamsSchema,
  goalQuerySchema,
} from './goal.schema'
import * as dm from '@/db/datamappers/goal.datamapper'

export async function getAll(req: FastifyRequest, reply: FastifyReply) {
  const query = goalQuerySchema.parse(req.query)
  const goals = await dm.findAllGoals(req.organizationId, query)
  reply.send(goals)
}

export async function getById(req: FastifyRequest, reply: FastifyReply) {
  const { id } = goalParamsSchema.parse(req.params)
  const goal = await dm.findGoalById(id, req.organizationId)
  if (!goal) return reply.notFound('Objectif introuvable')
  reply.send(goal)
}

export async function create(req: FastifyRequest, reply: FastifyReply) {
  const input = createGoalSchema.parse(req.body)
  const goal = await dm.createGoal(req.organizationId, input)
  reply.code(201).send(goal)
}

export async function update(req: FastifyRequest, reply: FastifyReply) {
  const { id } = goalParamsSchema.parse(req.params)
  const input = updateGoalSchema.parse(req.body)
  const goal = await dm.updateGoal(id, req.organizationId, input)
  if (!goal) return reply.notFound('Objectif introuvable')
  reply.send(goal)
}

export async function remove(req: FastifyRequest, reply: FastifyReply) {
  const { id } = goalParamsSchema.parse(req.params)
  const deleted = await dm.deleteGoal(id, req.organizationId)
  if (!deleted) return reply.notFound('Objectif introuvable')
  reply.code(204).send()
}
