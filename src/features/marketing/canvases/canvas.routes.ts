import type { FastifyInstance } from 'fastify'
import * as canvas from './canvas.controller'

export async function canvasRoutes(fastify: FastifyInstance) {
  fastify.get('/canvases',     canvas.getAll)
  fastify.post('/canvases',    canvas.create)
  fastify.get('/canvases/:id', canvas.getById)
  fastify.put('/canvases/:id', canvas.update)
  fastify.delete('/canvases/:id', canvas.remove)
}
