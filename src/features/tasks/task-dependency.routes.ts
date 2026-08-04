import type { FastifyInstance } from 'fastify'
import { getDependencies, createDependency, deleteDependency } from './task-dependency.controller'

export async function taskDependencyRoutes(fastify: FastifyInstance) {
  // Routes métier : réservées à l'owner du workspace (cf. auth.plugin.ts).
  const auth = { onRequest: [fastify.authenticate, fastify.requireOwner] }

  fastify.get('/projects/:id/tasks/:taskId/dependencies', auth, getDependencies)
  fastify.post('/projects/:id/tasks/:taskId/dependencies', auth, createDependency)
  fastify.delete('/projects/:id/tasks/:taskId/dependencies/:dependsOnId', auth, deleteDependency)
}
