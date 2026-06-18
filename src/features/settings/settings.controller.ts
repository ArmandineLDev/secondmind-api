import type { FastifyRequest, FastifyReply } from 'fastify'
import {
  preferencesSchema,
  addClientSchema,
  memberParamsSchema,
  projectAssignParamsSchema,
  projectAssignSchema,
} from './settings.schema'
import * as dm from '@/db/datamappers/settings.datamapper'
import {
  assignClientToProject,
  removeClientFromProject,
} from '@/db/datamappers/client.datamapper'

export async function getPreferences(req: FastifyRequest, reply: FastifyReply) {
  const settings = await dm.getOrCreateSettings(req.organizationId)
  reply.send(settings)
}

export async function updatePreferences(req: FastifyRequest, reply: FastifyReply) {
  const data    = preferencesSchema.parse(req.body)
  const updated = await dm.upsertSettings(req.organizationId, data)
  reply.send(updated)
}

export async function listClients(req: FastifyRequest, reply: FastifyReply) {
  const clients = await dm.listClientMembers(req.organizationId)
  reply.send(clients)
}

export async function addClient(req: FastifyRequest, reply: FastifyReply) {
  const { email } = addClientSchema.parse(req.body)

  const user = await dm.findUserByEmail(email)
  if (!user) return reply.notFound(`Aucun compte trouvé pour l'adresse ${email}`)

  const existing = await dm.findMember(user.id, req.organizationId)
  if (existing && existing.role !== 'client') {
    return reply.badRequest('Cet utilisateur est déjà membre avec un autre rôle')
  }

  await dm.addClientMember(user.id, req.organizationId)
  const clients = await dm.listClientMembers(req.organizationId)
  reply.code(201).send(clients)
}

export async function removeClient(req: FastifyRequest, reply: FastifyReply) {
  const { memberId } = memberParamsSchema.parse(req.params)
  const ok = await dm.removeClientMember(memberId, req.organizationId)
  if (!ok) return reply.notFound('Client introuvable')
  reply.code(204).send()
}

export async function assignProject(req: FastifyRequest, reply: FastifyReply) {
  const { memberId } = memberParamsSchema.parse(req.params)
  const { project_id } = projectAssignSchema.parse(req.body)

  // Retrouver le userId à partir du memberId
  const clients = await dm.listClientMembers(req.organizationId)
  const client  = clients.find((c) => c.member_id === memberId)
  if (!client) return reply.notFound('Client introuvable')

  await assignClientToProject(project_id, client.user_id)
  reply.code(201).send({ project_id, client_id: client.user_id })
}

export async function unassignProject(req: FastifyRequest, reply: FastifyReply) {
  const { memberId, projectId } = projectAssignParamsSchema.parse(req.params)

  const clients = await dm.listClientMembers(req.organizationId)
  const client  = clients.find((c) => c.member_id === memberId)
  if (!client) return reply.notFound('Client introuvable')

  await removeClientFromProject(projectId, client.user_id)
  reply.code(204).send()
}
