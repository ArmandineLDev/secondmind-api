import type { FastifyRequest, FastifyReply } from 'fastify'
import {
  weekStartParamsSchema,
  createWeekSchema,
  reviewSchema,
  dayParamsSchema,
  dayOffSchema,
  createBlockSchema,
  updateBlockSchema,
  blockStatusSchema,
  idParamsSchema,
} from './schedule.schema'
import { addDays, buildWeekView, foreignReference, invertedTimes, ownerOf } from './schedule.service'
import * as dm from '@/db/datamappers/schedule-week.datamapper'

const inWeek = (date: string, weekStart: string) => date >= weekStart && date <= addDays(weekStart, 6)

export async function getWeek(req: FastifyRequest, reply: FastifyReply) {
  const { weekStart } = weekStartParamsSchema.parse(req.params)
  reply.send(await buildWeekView(ownerOf(req), weekStart))
}

export async function createWeek(req: FastifyRequest, reply: FastifyReply) {
  const { week_start } = createWeekSchema.parse(req.body)
  const owner = ownerOf(req)
  try {
    await dm.generateWeek(owner, week_start)
  } catch (err) {
    if ((err as { code?: string }).code === '23505') return reply.conflict('Cette semaine existe déjà')
    throw err
  }
  reply.code(201).send(await buildWeekView(owner, week_start))
}

export async function reapplyTemplate(req: FastifyRequest, reply: FastifyReply) {
  const { id } = idParamsSchema.parse(req.params)
  const owner  = ownerOf(req)
  const week   = await dm.findWeekById(id, owner)
  if (!week) return reply.notFound('Semaine introuvable')
  await dm.reapplyTemplate(week.id)
  reply.send(await buildWeekView(owner, week.week_start))
}

export async function cancelWeek(req: FastifyRequest, reply: FastifyReply) {
  const { id } = idParamsSchema.parse(req.params)
  const owner  = ownerOf(req)
  const week   = await dm.findWeekById(id, owner)
  if (!week) return reply.notFound('Semaine introuvable')
  if (!(await dm.deleteWeekIfUntouched(week.id))) {
    return reply.conflict('Cette semaine a déjà un bilan : sa préparation ne peut plus être annulée')
  }
  reply.send(await buildWeekView(owner, week.week_start))
}

export async function updateReview(req: FastifyRequest, reply: FastifyReply) {
  const { id } = idParamsSchema.parse(req.params)
  const input  = reviewSchema.parse(req.body)
  const week   = await dm.findWeekById(id, ownerOf(req))
  if (!week) return reply.notFound('Semaine introuvable')
  reply.send(await dm.updateReview(week.id, input))
}

export async function setDayOff(req: FastifyRequest, reply: FastifyReply) {
  const { id, date } = dayParamsSchema.parse(req.params)
  const { off }      = dayOffSchema.parse(req.body)
  const owner        = ownerOf(req)
  const week         = await dm.findWeekById(id, owner)
  if (!week) return reply.notFound('Semaine introuvable')
  if (!inWeek(date, week.week_start)) return reply.badRequest('Ce jour n\'appartient pas à la semaine')
  await dm.setDayOff(week.id, date, off)
  reply.send(await buildWeekView(owner, week.week_start))
}

export async function createBlock(req: FastifyRequest, reply: FastifyReply) {
  const { id } = idParamsSchema.parse(req.params)
  const input  = createBlockSchema.parse(req.body)
  const week   = await dm.findWeekById(id, ownerOf(req))
  if (!week) return reply.notFound('Semaine introuvable')
  if (!inWeek(input.date, week.week_start)) return reply.badRequest('Ce jour n\'appartient pas à la semaine')
  const foreign = await foreignReference(req.organizationId, input)
  if (foreign) return reply.badRequest(foreign)
  reply.code(201).send(await dm.createBlock(week.id, input))
}

export async function updateBlock(req: FastifyRequest, reply: FastifyReply) {
  const { id }  = idParamsSchema.parse(req.params)
  const input   = updateBlockSchema.parse(req.body)
  const current = await dm.findBlockById(id, ownerOf(req))
  if (!current) return reply.notFound('Créneau introuvable')
  if (input.date && !inWeek(input.date, current.week_start)) {
    return reply.badRequest('Ce jour n\'appartient pas à la semaine')
  }
  if (invertedTimes(input, current)) return reply.badRequest('La fin doit suivre le début')
  const foreign = await foreignReference(req.organizationId, input)
  if (foreign) return reply.badRequest(foreign)
  reply.send(await dm.updateBlock(id, input))
}

export async function removeBlock(req: FastifyRequest, reply: FastifyReply) {
  const { id } = idParamsSchema.parse(req.params)
  const block  = await dm.findBlockById(id, ownerOf(req))
  if (!block) return reply.notFound('Créneau introuvable')
  await dm.deleteBlock(block.id)
  reply.code(204).send()
}

export async function setBlockStatus(req: FastifyRequest, reply: FastifyReply) {
  const { id } = idParamsSchema.parse(req.params)
  const input  = blockStatusSchema.parse(req.body)
  const block  = await dm.findBlockById(id, ownerOf(req))
  if (!block) return reply.notFound('Créneau introuvable')
  // Une durée réelle n'a de sens que pour du temps effectivement passé.
  const counts        = input.status === 'done' || input.status === 'partial'
  const actualMinutes = counts ? input.actual_minutes ?? null : null

  // Les valeurs suivent la définition copiée sur le créneau : une clé inconnue
  // serait invisible à l'écran, une valeur du mauvais type fausserait les totaux.
  // Une case vide n'est pas stockée.
  const values: Record<string, number | string> = {}
  for (const [label, value] of Object.entries(input.measure_values ?? {})) {
    const measure = block.measures.find((m) => m.label === label)
    if (!measure) return reply.badRequest(`Mesure inconnue : ${label}`)
    if (value === '') continue
    if (measure.type === 'number' && typeof value !== 'number') return reply.badRequest(`${label} : un nombre est attendu`)
    values[label] = measure.type === 'text' ? String(value).trim() : value
  }

  reply.send(await dm.setBlockStatus(block.id, req.organizationId, input.status, actualMinutes, input.note?.trim() || null, values))
}
