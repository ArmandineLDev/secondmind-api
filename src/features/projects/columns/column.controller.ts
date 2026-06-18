import type { FastifyRequest, FastifyReply } from 'fastify'
import {
  findColumnsByProject,
  findColumnById,
  createColumn,
  updateColumn,
  deleteColumn,
  reorderColumns,
} from '@/db/datamappers/column.datamapper'
import { findProjectById } from '@/db/datamappers/project.datamapper'
import {
  createColumnSchema,
  updateColumnSchema,
  reorderColumnsSchema,
  columnParamsSchema,
} from '@/features/projects/columns/column.schema'
import { projectParamsSchema } from '@/features/projects/project.schema'

async function assertProjectAccess(projectId: string, organizationId: string, reply: FastifyReply) {
  const project = await findProjectById(projectId, organizationId)
  if (!project) {
    reply.notFound('Projet introuvable')
    return false
  }
  return true
}

export async function getColumns(request: FastifyRequest, reply: FastifyReply) {
  const params = projectParamsSchema.safeParse(request.params)
  if (!params.success) return reply.badRequest(params.error.message)

  const ok = await assertProjectAccess(params.data.id, request.organizationId, reply)
  if (!ok) return

  const columns = await findColumnsByProject(params.data.id)
  return reply.send(columns)
}

export async function addColumn(request: FastifyRequest, reply: FastifyReply) {
  const params = projectParamsSchema.safeParse(request.params)
  if (!params.success) return reply.badRequest(params.error.message)

  const body = createColumnSchema.safeParse(request.body)
  if (!body.success) return reply.badRequest(body.error.message)

  const ok = await assertProjectAccess(params.data.id, request.organizationId, reply)
  if (!ok) return

  const column = await createColumn(params.data.id, body.data)
  return reply.status(201).send(column)
}

export async function patchColumn(request: FastifyRequest, reply: FastifyReply) {
  const params = columnParamsSchema.safeParse(request.params)
  if (!params.success) return reply.badRequest(params.error.message)

  const body = updateColumnSchema.safeParse(request.body)
  if (!body.success) return reply.badRequest(body.error.message)

  const ok = await assertProjectAccess(params.data.id, request.organizationId, reply)
  if (!ok) return

  const column = await updateColumn(params.data.colId, params.data.id, body.data)
  if (!column) return reply.notFound('Colonne introuvable')
  return reply.send(column)
}

export async function removeColumn(request: FastifyRequest, reply: FastifyReply) {
  const params = columnParamsSchema.safeParse(request.params)
  if (!params.success) return reply.badRequest(params.error.message)

  const ok = await assertProjectAccess(params.data.id, request.organizationId, reply)
  if (!ok) return

  const col = await findColumnById(params.data.colId, params.data.id)
  if (!col) return reply.notFound('Colonne introuvable')

  await deleteColumn(params.data.colId, params.data.id)
  return reply.status(204).send()
}

export async function reorder(request: FastifyRequest, reply: FastifyReply) {
  const params = projectParamsSchema.safeParse(request.params)
  if (!params.success) return reply.badRequest(params.error.message)

  const body = reorderColumnsSchema.safeParse(request.body)
  if (!body.success) return reply.badRequest(body.error.message)

  const ok = await assertProjectAccess(params.data.id, request.organizationId, reply)
  if (!ok) return

  await reorderColumns(params.data.id, body.data.order)
  return reply.status(204).send()
}
