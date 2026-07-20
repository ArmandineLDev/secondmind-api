import type { FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import {
  createSocialLinkSchema,
  updateSocialLinkSchema,
  socialLinkParamsSchema,
} from './social-link.schema'
import * as dm from '@/db/datamappers/social-link.datamapper'

const contactParamsSchema = z.object({ contactId: z.string().uuid() })

export async function getByContact(req: FastifyRequest, reply: FastifyReply) {
  const { contactId } = contactParamsSchema.parse(req.params)
  const links = await dm.findSocialLinksByContact(contactId, req.organizationId)
  reply.send(links)
}

export async function create(req: FastifyRequest, reply: FastifyReply) {
  const { contactId } = contactParamsSchema.parse(req.params)
  const input = createSocialLinkSchema.parse(req.body)
  const link = await dm.createSocialLink(contactId, input)
  reply.code(201).send(link)
}

export async function update(req: FastifyRequest, reply: FastifyReply) {
  const { contactId, id } = socialLinkParamsSchema.parse(req.params)
  const input = updateSocialLinkSchema.parse(req.body)
  const link = await dm.updateSocialLink(id, contactId, req.organizationId, input)
  if (!link) return reply.notFound('Lien introuvable')
  reply.send(link)
}

export async function remove(req: FastifyRequest, reply: FastifyReply) {
  const { contactId, id } = socialLinkParamsSchema.parse(req.params)
  const deleted = await dm.deleteSocialLink(id, contactId, req.organizationId)
  if (!deleted) return reply.notFound('Lien introuvable')
  reply.code(204).send()
}
