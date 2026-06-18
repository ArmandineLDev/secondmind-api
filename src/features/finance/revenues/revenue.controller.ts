import type { FastifyRequest, FastifyReply } from 'fastify'
import { createRevenueSchema, updateRevenueSchema, revenueParamsSchema, revenueQuerySchema } from './revenue.schema'
import * as dm from '@/db/datamappers/revenue.datamapper'

export async function getAll(req: FastifyRequest, reply: FastifyReply) {
  const query = revenueQuerySchema.parse(req.query)
  reply.send(await dm.findAllRevenues(req.organizationId, query))
}

export async function getById(req: FastifyRequest, reply: FastifyReply) {
  const { id } = revenueParamsSchema.parse(req.params)
  const revenue = await dm.findRevenueById(id, req.organizationId)
  if (!revenue) return reply.notFound('Revenu introuvable')
  reply.send(revenue)
}

export async function create(req: FastifyRequest, reply: FastifyReply) {
  const input = createRevenueSchema.parse(req.body)
  reply.code(201).send(await dm.createRevenue(req.organizationId, input))
}

export async function update(req: FastifyRequest, reply: FastifyReply) {
  const { id } = revenueParamsSchema.parse(req.params)
  const input = updateRevenueSchema.parse(req.body)
  const revenue = await dm.updateRevenue(id, req.organizationId, input)
  if (!revenue) return reply.notFound('Revenu introuvable')
  reply.send(revenue)
}

export async function remove(req: FastifyRequest, reply: FastifyReply) {
  const { id } = revenueParamsSchema.parse(req.params)
  if (!await dm.deleteRevenue(id, req.organizationId)) return reply.notFound('Revenu introuvable')
  reply.code(204).send()
}
