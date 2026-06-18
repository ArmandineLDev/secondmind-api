import type { FastifyRequest, FastifyReply } from 'fastify'
import { createTimeEntrySchema, updateTimeEntrySchema, timeEntryParamsSchema, timeEntryQuerySchema } from './time-entry.schema'
import * as dm from '@/db/datamappers/time-entry.datamapper'

export async function getAll(req: FastifyRequest, reply: FastifyReply) {
  const query = timeEntryQuerySchema.parse(req.query)
  reply.send(await dm.findAllTimeEntries(req.organizationId, query))
}

export async function getById(req: FastifyRequest, reply: FastifyReply) {
  const { id } = timeEntryParamsSchema.parse(req.params)
  const entry = await dm.findTimeEntryById(id, req.organizationId)
  if (!entry) return reply.notFound('Entrée de temps introuvable')
  reply.send(entry)
}

export async function create(req: FastifyRequest, reply: FastifyReply) {
  const input = createTimeEntrySchema.parse(req.body)
  reply.code(201).send(await dm.createTimeEntry(req.organizationId, input))
}

export async function update(req: FastifyRequest, reply: FastifyReply) {
  const { id } = timeEntryParamsSchema.parse(req.params)
  const input = updateTimeEntrySchema.parse(req.body)
  const entry = await dm.updateTimeEntry(id, req.organizationId, input)
  if (!entry) return reply.notFound('Entrée de temps introuvable')
  reply.send(entry)
}

export async function remove(req: FastifyRequest, reply: FastifyReply) {
  const { id } = timeEntryParamsSchema.parse(req.params)
  if (!await dm.deleteTimeEntry(id, req.organizationId)) return reply.notFound('Entrée de temps introuvable')
  reply.code(204).send()
}
