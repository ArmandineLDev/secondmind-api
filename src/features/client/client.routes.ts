import type { FastifyInstance } from 'fastify'
import * as client from './client.controller'

export async function clientRoutes(fastify: FastifyInstance) {
  // Réservé aux clients invités : un owner n'a aucun projet assigné à lui-même.
  const auth = { onRequest: [fastify.authenticate, fastify.requireClient] }

  fastify.get('/client/projects', auth,              client.getProjects)
  fastify.get('/client/projects/:id', auth,          client.getProjectById)
  fastify.get('/client/documents', auth,             client.getDocuments)
  fastify.get('/client/documents/:id/url', auth,     client.getDocumentUrl)
}
