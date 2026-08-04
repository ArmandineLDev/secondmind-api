import type { FastifyInstance } from 'fastify'
import * as vpCanvas from './vp-canvas.controller'

export async function vpCanvasRoutes(fastify: FastifyInstance) {
  // Routes métier : réservées à l'owner du workspace (cf. auth.plugin.ts).
  const auth = { onRequest: [fastify.authenticate, fastify.requireOwner] }

  fastify.get('/vp-canvases', auth,     vpCanvas.getAll)
  fastify.post('/vp-canvases', auth,    vpCanvas.create)
  fastify.get('/vp-canvases/:id', auth, vpCanvas.getById)
  fastify.put('/vp-canvases/:id', auth, vpCanvas.update)
  fastify.delete('/vp-canvases/:id', auth, vpCanvas.remove)
}
