import type { FastifyRequest, FastifyReply } from 'fastify'
import { createHolidaySchema, updateHolidaySchema, idParamsSchema } from './schedule.schema'
import { ownerOf } from './schedule.service'
import * as dm from '@/db/datamappers/holiday-period.datamapper'

export async function getAll(req: FastifyRequest, reply: FastifyReply) {
  reply.send(await dm.findHolidayPeriods(ownerOf(req)))
}

export async function create(req: FastifyRequest, reply: FastifyReply) {
  const input = createHolidaySchema.parse(req.body)
  reply.code(201).send(await dm.createHolidayPeriod(ownerOf(req), input))
}

export async function update(req: FastifyRequest, reply: FastifyReply) {
  const { id } = idParamsSchema.parse(req.params)
  const input  = updateHolidaySchema.parse(req.body)
  // Le CHECK end_date >= start_date protège la base ; une modification d'une
  // seule borne qui l'enfreindrait remonterait en 500 — on la refuse en clair.
  try {
    const period = await dm.updateHolidayPeriod(id, ownerOf(req), input)
    if (!period) return reply.notFound('Période introuvable')
    reply.send(period)
  } catch (err) {
    if ((err as { code?: string }).code === '23514') return reply.badRequest('La fin doit suivre le début')
    throw err
  }
}

export async function remove(req: FastifyRequest, reply: FastifyReply) {
  const { id } = idParamsSchema.parse(req.params)
  const deleted = await dm.deleteHolidayPeriod(id, ownerOf(req))
  if (!deleted) return reply.notFound('Période introuvable')
  reply.code(204).send()
}
