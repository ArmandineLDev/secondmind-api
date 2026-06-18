import type { FastifyRequest, FastifyReply } from 'fastify'
import {
  createContactSchema,
  updateContactSchema,
  contactParamsSchema,
  contactQuerySchema,
} from './contact.schema'
import * as dm from '@/db/datamappers/contact.datamapper'

export async function getAll(req: FastifyRequest, reply: FastifyReply) {
  const query = contactQuerySchema.parse(req.query)
  const contacts = await dm.findAllContacts(req.organizationId, query)
  reply.send(contacts)
}

export async function getById(req: FastifyRequest, reply: FastifyReply) {
  const { id } = contactParamsSchema.parse(req.params)
  const contact = await dm.findContactById(id, req.organizationId)
  if (!contact) return reply.notFound('Contact introuvable')
  reply.send(contact)
}

export async function create(req: FastifyRequest, reply: FastifyReply) {
  const input = createContactSchema.parse(req.body)
  const contact = await dm.createContact(req.organizationId, input)
  reply.code(201).send(contact)
}

export async function update(req: FastifyRequest, reply: FastifyReply) {
  const { id } = contactParamsSchema.parse(req.params)
  const input = updateContactSchema.parse(req.body)
  const contact = await dm.updateContact(id, req.organizationId, input)
  if (!contact) return reply.notFound('Contact introuvable')
  reply.send(contact)
}

export async function remove(req: FastifyRequest, reply: FastifyReply) {
  const { id } = contactParamsSchema.parse(req.params)
  const deleted = await dm.deleteContact(id, req.organizationId)
  if (!deleted) return reply.notFound('Contact introuvable')
  reply.code(204).send()
}
