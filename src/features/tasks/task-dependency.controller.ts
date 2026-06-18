import type { FastifyRequest, FastifyReply } from 'fastify'
import { findProjectById } from '@/db/datamappers/project.datamapper'
import { findTaskById } from '@/db/datamappers/task.datamapper'
import {
  findDependencies,
  addDependency,
  removeDependency,
} from '@/db/datamappers/task-dependency.datamapper'
import { addDependencySchema, dependencyParamsSchema } from './task-dependency.schema'
import { taskParamsSchema } from './task.schema'
import { projectParamsSchema } from '@/features/projects/project.schema'

async function assertTaskAccess(
  projectId: string,
  taskId: string,
  organizationId: string,
  reply: FastifyReply,
): Promise<boolean> {
  const project = await findProjectById(projectId, organizationId)
  if (!project) { reply.notFound('Projet introuvable'); return false }
  const task = await findTaskById(taskId, projectId, organizationId)
  if (!task) { reply.notFound('Tâche introuvable'); return false }
  return true
}

export async function getDependencies(request: FastifyRequest, reply: FastifyReply) {
  const params = taskParamsSchema.safeParse(request.params)
  if (!params.success) return reply.badRequest(params.error.message)

  const ok = await assertTaskAccess(params.data.id, params.data.taskId, request.organizationId, reply)
  if (!ok) return

  const deps = await findDependencies(params.data.taskId, params.data.id)
  return reply.send(deps)
}

export async function createDependency(request: FastifyRequest, reply: FastifyReply) {
  const params = taskParamsSchema.safeParse(request.params)
  if (!params.success) return reply.badRequest(params.error.message)

  const body = addDependencySchema.safeParse(request.body)
  if (!body.success) return reply.badRequest(body.error.message)

  if (params.data.taskId === body.data.depends_on_id) {
    return reply.badRequest('Une tâche ne peut pas dépendre d\'elle-même')
  }

  const ok = await assertTaskAccess(params.data.id, params.data.taskId, request.organizationId, reply)
  if (!ok) return

  const blocker = await findTaskById(body.data.depends_on_id, params.data.id, request.organizationId)
  if (!blocker) return reply.notFound('Tâche bloquante introuvable dans ce projet')

  const dep = await addDependency(params.data.taskId, body.data.depends_on_id)
  if (!dep) return reply.conflict('Cette dépendance existe déjà')

  return reply.status(201).send(dep)
}

export async function deleteDependency(request: FastifyRequest, reply: FastifyReply) {
  const params = dependencyParamsSchema.safeParse(request.params)
  if (!params.success) return reply.badRequest(params.error.message)

  const project = await findProjectById(params.data.id, request.organizationId)
  if (!project) return reply.notFound('Projet introuvable')

  const deleted = await removeDependency(params.data.taskId, params.data.dependsOnId)
  if (!deleted) return reply.notFound('Dépendance introuvable')

  return reply.status(204).send()
}
