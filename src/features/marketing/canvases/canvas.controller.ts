import type { FastifyRequest, FastifyReply } from 'fastify'
import {
  createCanvasSchema,
  updateCanvasSchema,
  canvasParamsSchema,
} from './canvas.schema'
import * as dm from '@/db/datamappers/canvas.datamapper'

export async function getAll(req: FastifyRequest, reply: FastifyReply) {
  const canvases = await dm.findAllCanvases(req.organizationId)
  reply.send(canvases)
}

export async function getById(req: FastifyRequest, reply: FastifyReply) {
  const { id } = canvasParamsSchema.parse(req.params)
  const canvas = await dm.findCanvasById(id, req.organizationId)
  if (!canvas) return reply.notFound('Canvas introuvable')
  reply.send(canvas)
}

export async function create(req: FastifyRequest, reply: FastifyReply) {
  const input = createCanvasSchema.parse(req.body)
  const canvas = await dm.createCanvas(req.organizationId, input)
  reply.code(201).send(canvas)
}

export async function update(req: FastifyRequest, reply: FastifyReply) {
  const { id } = canvasParamsSchema.parse(req.params)
  const input = updateCanvasSchema.parse(req.body)
  const canvas = await dm.updateCanvas(id, req.organizationId, input)
  if (!canvas) return reply.notFound('Canvas introuvable')
  reply.send(canvas)
}

export async function remove(req: FastifyRequest, reply: FastifyReply) {
  const { id } = canvasParamsSchema.parse(req.params)
  const deleted = await dm.deleteCanvas(id, req.organizationId)
  if (!deleted) return reply.notFound('Canvas introuvable')
  reply.code(204).send()
}
