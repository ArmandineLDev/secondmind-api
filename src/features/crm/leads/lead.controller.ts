import type { FastifyRequest, FastifyReply } from 'fastify'
import {
  createLeadSchema,
  updateLeadSchema,
  leadParamsSchema,
  leadQuerySchema,
} from './lead.schema'
import * as dm from '@/db/datamappers/lead.datamapper'

export async function getAll(req: FastifyRequest, reply: FastifyReply) {
  const query = leadQuerySchema.parse(req.query)
  const leads = await dm.findAllLeads(req.organizationId, query)
  reply.send(leads)
}

export async function getById(req: FastifyRequest, reply: FastifyReply) {
  const { id } = leadParamsSchema.parse(req.params)
  const lead = await dm.findLeadById(id, req.organizationId)
  if (!lead) return reply.notFound('Lead introuvable')
  reply.send(lead)
}

export async function create(req: FastifyRequest, reply: FastifyReply) {
  const input = createLeadSchema.parse(req.body)
  const lead = await dm.createLead(req.organizationId, input)
  reply.code(201).send(lead)
}

export async function update(req: FastifyRequest, reply: FastifyReply) {
  const { id } = leadParamsSchema.parse(req.params)
  const input = updateLeadSchema.parse(req.body)
  const lead = await dm.updateLead(id, req.organizationId, input)
  if (!lead) return reply.notFound('Lead introuvable')
  reply.send(lead)
}

export async function remove(req: FastifyRequest, reply: FastifyReply) {
  const { id } = leadParamsSchema.parse(req.params)
  const deleted = await dm.deleteLead(id, req.organizationId)
  if (!deleted) return reply.notFound('Lead introuvable')
  reply.code(204).send()
}
