import type { FastifyInstance } from 'fastify'
import * as doc from './document.controller'

export async function documentRoutes(fastify: FastifyInstance) {
  fastify.get('/documents',            doc.getAll)
  fastify.post('/documents',           doc.upload)
  fastify.get('/documents/:id',        doc.getById)
  fastify.get('/documents/:id/url',    doc.getSignedUrl)
  fastify.delete('/documents/:id',     doc.remove)
}
