import type { FastifyRequest, FastifyReply } from 'fastify'
import {
  createAppointmentTemplateSchema,
  updateAppointmentTemplateSchema,
  createAppointmentSchema,
  updateAppointmentSchema,
  appointmentQuerySchema,
  appointmentOutcomeSchema,
} from './appointment.schema'
import { idParamsSchema, toMinutes } from './schedule.schema'
import { foreignReference, ownerOf } from './schedule.service'
import type { ScheduleOwner } from './schedule.types'
import * as dm from '@/db/datamappers/appointment.datamapper'

async function foreignTemplate(templateId: string | null | undefined, owner: ScheduleOwner) {
  return !!templateId && !(await dm.appointmentTemplateBelongsTo(templateId, owner))
}

// ── Modèles ───────────────────────────────────────────────────────────────────

export async function getTemplates(req: FastifyRequest, reply: FastifyReply) {
  reply.send(await dm.findAppointmentTemplates(ownerOf(req)))
}

export async function createTemplate(req: FastifyRequest, reply: FastifyReply) {
  const input = createAppointmentTemplateSchema.parse(req.body)
  reply.code(201).send(await dm.createAppointmentTemplate(ownerOf(req), input))
}

export async function updateTemplate(req: FastifyRequest, reply: FastifyReply) {
  const { id }   = idParamsSchema.parse(req.params)
  const input    = updateAppointmentTemplateSchema.parse(req.body)
  const template = await dm.updateAppointmentTemplate(id, ownerOf(req), input)
  if (!template) return reply.notFound('Modèle introuvable')
  reply.send(template)
}

export async function removeTemplate(req: FastifyRequest, reply: FastifyReply) {
  const { id }  = idParamsSchema.parse(req.params)
  const deleted = await dm.deleteAppointmentTemplate(id, ownerOf(req))
  if (!deleted) return reply.notFound('Modèle introuvable')
  reply.code(204).send()
}

// ── Rendez-vous ───────────────────────────────────────────────────────────────

export async function getAll(req: FastifyRequest, reply: FastifyReply) {
  const query = appointmentQuerySchema.parse(req.query)
  reply.send(await dm.findAppointments(ownerOf(req), query))
}

export async function create(req: FastifyRequest, reply: FastifyReply) {
  const input = createAppointmentSchema.parse(req.body)
  const owner = ownerOf(req)
  const foreign = await foreignReference(req.organizationId, input)
  if (foreign) return reply.badRequest(foreign)
  if (await foreignTemplate(input.template_id, owner)) return reply.badRequest('Modèle introuvable')
  reply.code(201).send(await dm.createAppointment(owner, input))
}

export async function update(req: FastifyRequest, reply: FastifyReply) {
  const { id } = idParamsSchema.parse(req.params)
  const input  = updateAppointmentSchema.parse(req.body)
  const owner  = ownerOf(req)
  const foreign = await foreignReference(req.organizationId, input)
  if (foreign) return reply.badRequest(foreign)
  if (await foreignTemplate(input.template_id, owner)) return reply.badRequest('Modèle introuvable')
  try {
    const appointment = await dm.updateAppointment(id, owner, input)
    if (!appointment) return reply.notFound('Rendez-vous introuvable')
    reply.send(appointment)
  } catch (err) {
    // Avancer l'heure après une sortie réelle déjà notée viole le CHECK.
    if ((err as { code?: string }).code === '23514') {
      return reply.badRequest('L\'heure de sortie notée précède la nouvelle heure du rendez-vous')
    }
    throw err
  }
}

export async function remove(req: FastifyRequest, reply: FastifyReply) {
  const { id }  = idParamsSchema.parse(req.params)
  const deleted = await dm.deleteAppointment(id, ownerOf(req))
  if (!deleted) return reply.notFound('Rendez-vous introuvable')
  reply.code(204).send()
}

export async function setOutcome(req: FastifyRequest, reply: FastifyReply) {
  const { id }      = idParamsSchema.parse(req.params)
  const input       = appointmentOutcomeSchema.parse(req.body)
  const appointment = await dm.findAppointmentById(id, ownerOf(req))
  if (!appointment) return reply.notFound('Rendez-vous introuvable')

  // L'heure de sortie ne concerne qu'un rendez-vous effectivement honoré.
  const actualEnd = input.status === 'done' ? input.actual_end_time ?? null : null
  if (actualEnd && toMinutes(actualEnd) <= toMinutes(appointment.start_time)) {
    return reply.badRequest('La sortie doit suivre l\'heure du rendez-vous')
  }
  reply.send(await dm.setAppointmentOutcome(appointment, input.status, actualEnd))
}
