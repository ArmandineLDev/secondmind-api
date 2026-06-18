import type { FastifyInstance } from 'fastify'
import * as client from './client.controller'

export async function clientRoutes(fastify: FastifyInstance) {
  fastify.get('/client/projects',              client.getProjects)
  fastify.get('/client/projects/:id',          client.getProjectById)
  fastify.get('/client/documents',             client.getDocuments)
  fastify.get('/client/documents/:id/url',     client.getDocumentUrl)
}
