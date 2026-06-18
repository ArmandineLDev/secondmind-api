import type { FastifyRequest, FastifyReply } from 'fastify'
import {
  findAllTasks,
  findTasksByProject,
  createTask,
  updateTask,
  moveTask,
  deleteTask,
} from '@/db/datamappers/task.datamapper'
import { findProjectById } from '@/db/datamappers/project.datamapper'
import {
  createTaskSchema,
  updateTaskSchema,
  moveTaskSchema,
  taskParamsSchema,
  listTasksQuerySchema,
} from '@/features/tasks/task.schema'
import { projectParamsSchema } from '@/features/projects/project.schema'

async function assertProjectAccess(projectId: string, organizationId: string, reply: FastifyReply) {
  const project = await findProjectById(projectId, organizationId)
  if (!project) {
    reply.notFound('Projet introuvable')
    return false
  }
  return true
}

export async function getTasks(request: FastifyRequest, reply: FastifyReply) {
  const query = listTasksQuerySchema.safeParse(request.query)
  if (!query.success) return reply.badRequest(query.error.message)

  const tasks = await findAllTasks(request.organizationId, query.data)
  return reply.send(tasks)
}

export async function getProjectTasks(request: FastifyRequest, reply: FastifyReply) {
  const params = projectParamsSchema.safeParse(request.params)
  if (!params.success) return reply.badRequest(params.error.message)

  const ok = await assertProjectAccess(params.data.id, request.organizationId, reply)
  if (!ok) return

  const tasks = await findTasksByProject(params.data.id, request.organizationId)
  return reply.send(tasks)
}

export async function addTask(request: FastifyRequest, reply: FastifyReply) {
  const params = projectParamsSchema.safeParse(request.params)
  if (!params.success) return reply.badRequest(params.error.message)

  const body = createTaskSchema.safeParse(request.body)
  if (!body.success) return reply.badRequest(body.error.message)

  const ok = await assertProjectAccess(params.data.id, request.organizationId, reply)
  if (!ok) return

  const task = await createTask(params.data.id, body.data)
  return reply.status(201).send(task)
}

export async function patchTask(request: FastifyRequest, reply: FastifyReply) {
  const params = taskParamsSchema.safeParse(request.params)
  if (!params.success) return reply.badRequest(params.error.message)

  const body = updateTaskSchema.safeParse(request.body)
  if (!body.success) return reply.badRequest(body.error.message)

  const task = await updateTask(params.data.taskId, params.data.id, request.organizationId, body.data)
  if (!task) return reply.notFound('Tâche introuvable')
  return reply.send(task)
}

export async function relocateTask(request: FastifyRequest, reply: FastifyReply) {
  const params = taskParamsSchema.safeParse(request.params)
  if (!params.success) return reply.badRequest(params.error.message)

  const body = moveTaskSchema.safeParse(request.body)
  if (!body.success) return reply.badRequest(body.error.message)

  const task = await moveTask(params.data.taskId, params.data.id, request.organizationId, body.data)
  if (!task) return reply.notFound('Tâche introuvable')
  return reply.send(task)
}

export async function removeTask(request: FastifyRequest, reply: FastifyReply) {
  const params = taskParamsSchema.safeParse(request.params)
  if (!params.success) return reply.badRequest(params.error.message)

  const deleted = await deleteTask(params.data.taskId, params.data.id, request.organizationId)
  if (!deleted) return reply.notFound('Tâche introuvable')
  return reply.status(204).send()
}
