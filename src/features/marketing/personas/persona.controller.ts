import type { FastifyRequest, FastifyReply } from 'fastify'
import {
  createPersonaSchema,
  updatePersonaSchema,
  personaParamsSchema,
} from './persona.schema'
import * as dm from '@/db/datamappers/persona.datamapper'

export async function getAll(req: FastifyRequest, reply: FastifyReply) {
  const personas = await dm.findAllPersonas(req.organizationId)
  reply.send(personas)
}

export async function getById(req: FastifyRequest, reply: FastifyReply) {
  const { id } = personaParamsSchema.parse(req.params)
  const persona = await dm.findPersonaById(id, req.organizationId)
  if (!persona) return reply.notFound('Persona introuvable')
  reply.send(persona)
}

export async function create(req: FastifyRequest, reply: FastifyReply) {
  const input = createPersonaSchema.parse(req.body)
  const persona = await dm.createPersona(req.organizationId, input)
  reply.code(201).send(persona)
}

export async function update(req: FastifyRequest, reply: FastifyReply) {
  const { id } = personaParamsSchema.parse(req.params)
  const input = updatePersonaSchema.parse(req.body)
  const persona = await dm.updatePersona(id, req.organizationId, input)
  if (!persona) return reply.notFound('Persona introuvable')
  reply.send(persona)
}

export async function remove(req: FastifyRequest, reply: FastifyReply) {
  const { id } = personaParamsSchema.parse(req.params)
  const deleted = await dm.deletePersona(id, req.organizationId)
  if (!deleted) return reply.notFound('Persona introuvable')
  reply.code(204).send()
}
