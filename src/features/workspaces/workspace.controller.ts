import type { FastifyRequest, FastifyReply } from 'fastify'
import { findWorkspacesForUser, switchWorkspace } from '@/db/datamappers/organization.datamapper'
import { workspaceParamsSchema } from './workspace.schema'

export async function getAll(request: FastifyRequest, reply: FastifyReply) {
  const workspaces = await findWorkspacesForUser(request.session.user.id)
  return reply.send(
    workspaces.map((w) => ({ ...w, is_active: w.id === request.organizationId })),
  )
}

export async function activate(request: FastifyRequest, reply: FastifyReply) {
  const { id } = workspaceParamsSchema.parse(request.params)

  const switched = await switchWorkspace(
    request.session.user.id,
    request.session.session.token,
    id,
  )

  // 404 plutôt que 403 : répondre « interdit » confirmerait l'existence du
  // workspace à quelqu'un qui essaie des identifiants au hasard.
  if (!switched) return reply.notFound('Workspace introuvable')

  return reply.status(204).send()
}
