import type { FastifyInstance } from 'fastify'
import * as doc from './document.controller'

export async function documentRoutes(fastify: FastifyInstance) {
  // Routes métier : réservées à l'owner du workspace (cf. auth.plugin.ts).
  const auth = { onRequest: [fastify.authenticate, fastify.requireOwner] }

  fastify.get('/documents', auth,            doc.getAll)
  fastify.post('/documents', auth,           doc.upload)
  fastify.get('/documents/:id', auth,        doc.getById)
  fastify.get('/documents/:id/url', auth,    doc.getSignedUrl)
  fastify.delete('/documents/:id', auth,     doc.remove)
}
