import type { FastifyRequest, FastifyReply } from 'fastify'
import { createTemplateBlockSchema, updateTemplateBlockSchema, idParamsSchema } from './schedule.schema'
import { foreignReference, invertedTimes, ownerOf } from './schedule.service'
import * as dm from '@/db/datamappers/schedule-template.datamapper'

export async function getAll(req: FastifyRequest, reply: FastifyReply) {
  reply.send(await dm.findTemplateBlocks(ownerOf(req)))
}

export async function create(req: FastifyRequest, reply: FastifyReply) {
  const input = createTemplateBlockSchema.parse(req.body)
  const foreign = await foreignReference(req.organizationId, input)
  if (foreign) return reply.badRequest(foreign)
  reply.code(201).send(await dm.createTemplateBlock(ownerOf(req), input))
}

export async function update(req: FastifyRequest, reply: FastifyReply) {
  const { id }  = idParamsSchema.parse(req.params)
  const input   = updateTemplateBlockSchema.parse(req.body)
  const owner   = ownerOf(req)
  const current = await dm.findTemplateBlockById(id, owner)
  if (!current) return reply.notFound('Créneau introuvable')
  if (invertedTimes(input, current)) return reply.badRequest('La fin doit suivre le début')
  const foreign = await foreignReference(req.organizationId, input)
  if (foreign) return reply.badRequest(foreign)
  reply.send(await dm.updateTemplateBlock(id, owner, input))
}

export async function remove(req: FastifyRequest, reply: FastifyReply) {
  const { id } = idParamsSchema.parse(req.params)
  const deleted = await dm.deleteTemplateBlock(id, ownerOf(req))
  if (!deleted) return reply.notFound('Créneau introuvable')
  reply.code(204).send()
}
