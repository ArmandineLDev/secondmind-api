import type { FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import {
  createInteractionSchema,
  updateInteractionSchema,
  interactionParamsSchema,
} from './interaction.schema'
import * as dm from '@/db/datamappers/interaction.datamapper'

const contactParamsSchema = z.object({ contactId: z.string().uuid() })

export async function getByContact(req: FastifyRequest, reply: FastifyReply) {
  const { contactId } = contactParamsSchema.parse(req.params)
  const interactions = await dm.findInteractionsByContact(contactId, req.organizationId)
  reply.send(interactions)
}

export async function create(req: FastifyRequest, reply: FastifyReply) {
  const { contactId } = contactParamsSchema.parse(req.params)
  const input = createInteractionSchema.parse(req.body)
  const interaction = await dm.createInteraction(contactId, input)
  reply.code(201).send(interaction)
}

export async function update(req: FastifyRequest, reply: FastifyReply) {
  const { contactId, id } = interactionParamsSchema.parse(req.params)
  const input = updateInteractionSchema.parse(req.body)
  const interaction = await dm.updateInteraction(id, contactId, req.organizationId, input)
  if (!interaction) return reply.notFound('Interaction introuvable')
  reply.send(interaction)
}

export async function remove(req: FastifyRequest, reply: FastifyReply) {
  const { contactId, id } = interactionParamsSchema.parse(req.params)
  const deleted = await dm.deleteInteraction(id, contactId, req.organizationId)
  if (!deleted) return reply.notFound('Interaction introuvable')
  reply.code(204).send()
}
