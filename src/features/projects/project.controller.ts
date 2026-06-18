import type { FastifyRequest, FastifyReply } from 'fastify'
import { createProjectWithDefaults } from '@/features/projects/project.service'
import {
  findAllProjects,
  findProjectById,
  updateProject,
  archiveProject,
  deleteProject,
} from '@/db/datamappers/project.datamapper'
import {
  createProjectSchema,
  updateProjectSchema,
  projectParamsSchema,
  listProjectsQuerySchema,
} from '@/features/projects/project.schema'

export async function getProjects(request: FastifyRequest, reply: FastifyReply) {
  const query = listProjectsQuerySchema.safeParse(request.query)
  if (!query.success) return reply.badRequest(query.error.message)

  const projects = await findAllProjects(request.organizationId, query.data.archived)
  return reply.send(projects)
}

export async function getProject(request: FastifyRequest, reply: FastifyReply) {
  const params = projectParamsSchema.safeParse(request.params)
  if (!params.success) return reply.badRequest(params.error.message)

  const project = await findProjectById(params.data.id, request.organizationId)
  if (!project) return reply.notFound('Projet introuvable')
  return reply.send(project)
}

export async function createProject(request: FastifyRequest, reply: FastifyReply) {
  const body = createProjectSchema.safeParse(request.body)
  if (!body.success) return reply.badRequest(body.error.message)

  const project = await createProjectWithDefaults(request.organizationId, body.data)
  return reply.status(201).send(project)
}

export async function patchProject(request: FastifyRequest, reply: FastifyReply) {
  const params = projectParamsSchema.safeParse(request.params)
  if (!params.success) return reply.badRequest(params.error.message)

  const body = updateProjectSchema.safeParse(request.body)
  if (!body.success) return reply.badRequest(body.error.message)

  const project = await updateProject(params.data.id, request.organizationId, body.data)
  if (!project) return reply.notFound('Projet introuvable')
  return reply.send(project)
}

export async function toggleArchiveProject(request: FastifyRequest, reply: FastifyReply) {
  const params = projectParamsSchema.safeParse(request.params)
  if (!params.success) return reply.badRequest(params.error.message)

  const body = (request.body as { archive?: unknown })
  const archive = Boolean(body?.archive)

  const project = await archiveProject(params.data.id, request.organizationId, archive)
  if (!project) return reply.notFound('Projet introuvable ou projet par défaut non modifiable')
  return reply.send(project)
}

export async function removeProject(request: FastifyRequest, reply: FastifyReply) {
  const params = projectParamsSchema.safeParse(request.params)
  if (!params.success) return reply.badRequest(params.error.message)

  const deleted = await deleteProject(params.data.id, request.organizationId)
  if (!deleted) return reply.notFound('Projet introuvable ou projet par défaut non supprimable')
  return reply.status(204).send()
}
