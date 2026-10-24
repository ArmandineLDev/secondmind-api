import type { FastifyRequest, FastifyReply } from 'fastify'
import {
  createSwotSchema,
  updateSwotSchema,
  swotParamsSchema,
} from './swot.schema'
import * as dm from '@/db/datamappers/swot.datamapper'

export async function getAll(req: FastifyRequest, reply: FastifyReply) {
  const swots = await dm.findAllSwots(req.organizationId)
  reply.send(swots)
}

export async function getById(req: FastifyRequest, reply: FastifyReply) {
  const { id } = swotParamsSchema.parse(req.params)
  const swot = await dm.findSwotById(id, req.organizationId)
  if (!swot) return reply.notFound('Analyse SWOT introuvable')
  reply.send(swot)
}

export async function create(req: FastifyRequest, reply: FastifyReply) {
  const input = createSwotSchema.parse(req.body)
  const swot = await dm.createSwot(req.organizationId, input)
  reply.code(201).send(swot)
}

export async function update(req: FastifyRequest, reply: FastifyReply) {
  const { id } = swotParamsSchema.parse(req.params)
  const input = updateSwotSchema.parse(req.body)
  const swot = await dm.updateSwot(id, req.organizationId, input)
  if (!swot) return reply.notFound('Analyse SWOT introuvable')
  reply.send(swot)
}

export async function remove(req: FastifyRequest, reply: FastifyReply) {
  const { id } = swotParamsSchema.parse(req.params)
  const deleted = await dm.deleteSwot(id, req.organizationId)
  if (!deleted) return reply.notFound('Analyse SWOT introuvable')
  reply.code(204).send()
}
