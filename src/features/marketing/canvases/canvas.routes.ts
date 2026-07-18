import type { FastifyInstance } from 'fastify'
import * as canvas from './canvas.controller'

export async function canvasRoutes(fastify: FastifyInstance) {
  const auth = { onRequest: [fastify.authenticate] }

  fastify.get('/canvases', auth,     canvas.getAll)
  fastify.post('/canvases', auth,    canvas.create)
  fastify.get('/canvases/:id', auth, canvas.getById)
  fastify.put('/canvases/:id', auth, canvas.update)
  fastify.delete('/canvases/:id', auth, canvas.remove)
}
