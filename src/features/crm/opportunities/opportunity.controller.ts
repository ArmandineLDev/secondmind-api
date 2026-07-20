import type { FastifyRequest, FastifyReply } from 'fastify'
import {
  createOpportunitySchema,
  updateOpportunitySchema,
  opportunityParamsSchema,
  opportunityQuerySchema,
} from './opportunity.schema'
import * as dm from '@/db/datamappers/opportunity.datamapper'

export async function getAll(req: FastifyRequest, reply: FastifyReply) {
  const query = opportunityQuerySchema.parse(req.query)
  const opportunities = await dm.findAllOpportunities(req.organizationId, query)
  reply.send(opportunities)
}

export async function getById(req: FastifyRequest, reply: FastifyReply) {
  const { id } = opportunityParamsSchema.parse(req.params)
  const opportunity = await dm.findOpportunityById(id, req.organizationId)
  if (!opportunity) return reply.notFound('Opportunité introuvable')
  reply.send(opportunity)
}

export async function create(req: FastifyRequest, reply: FastifyReply) {
  const input = createOpportunitySchema.parse(req.body)
  const opportunity = await dm.createOpportunity(req.organizationId, input)
  reply.code(201).send(opportunity)
}

export async function update(req: FastifyRequest, reply: FastifyReply) {
  const { id } = opportunityParamsSchema.parse(req.params)
  const input = updateOpportunitySchema.parse(req.body)
  const opportunity = await dm.updateOpportunity(id, req.organizationId, input)
  if (!opportunity) return reply.notFound('Opportunité introuvable')
  reply.send(opportunity)
}

export async function remove(req: FastifyRequest, reply: FastifyReply) {
  const { id } = opportunityParamsSchema.parse(req.params)
  const deleted = await dm.deleteOpportunity(id, req.organizationId)
  if (!deleted) return reply.notFound('Opportunité introuvable')
  reply.code(204).send()
}
