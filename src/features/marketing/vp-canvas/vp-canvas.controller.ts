import type { FastifyRequest, FastifyReply } from 'fastify'
import {
  createVpCanvasSchema,
  updateVpCanvasSchema,
  vpCanvasParamsSchema,
} from './vp-canvas.schema'
import * as dm from '@/db/datamappers/vp-canvas.datamapper'

export async function getAll(req: FastifyRequest, reply: FastifyReply) {
  const canvases = await dm.findAllVpCanvases(req.organizationId)
  reply.send(canvases)
}

export async function getById(req: FastifyRequest, reply: FastifyReply) {
  const { id } = vpCanvasParamsSchema.parse(req.params)
  const canvas = await dm.findVpCanvasById(id, req.organizationId)
  if (!canvas) return reply.notFound('Value Proposition Canvas introuvable')
  reply.send(canvas)
}

export async function create(req: FastifyRequest, reply: FastifyReply) {
  const input = createVpCanvasSchema.parse(req.body)
  const canvas = await dm.createVpCanvas(req.organizationId, input)
  reply.code(201).send(canvas)
}

export async function update(req: FastifyRequest, reply: FastifyReply) {
  const { id } = vpCanvasParamsSchema.parse(req.params)
  const input = updateVpCanvasSchema.parse(req.body)
  const canvas = await dm.updateVpCanvas(id, req.organizationId, input)
  if (!canvas) return reply.notFound('Value Proposition Canvas introuvable')
  reply.send(canvas)
}

export async function remove(req: FastifyRequest, reply: FastifyReply) {
  const { id } = vpCanvasParamsSchema.parse(req.params)
  const deleted = await dm.deleteVpCanvas(id, req.organizationId)
  if (!deleted) return reply.notFound('Value Proposition Canvas introuvable')
  reply.code(204).send()
}
