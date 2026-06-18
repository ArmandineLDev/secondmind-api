import type { FastifyInstance } from 'fastify'
import { getDependencies, createDependency, deleteDependency } from './task-dependency.controller'

export async function taskDependencyRoutes(fastify: FastifyInstance) {
  const auth = { onRequest: [fastify.authenticate] }

  fastify.get('/projects/:id/tasks/:taskId/dependencies', auth, getDependencies)
  fastify.post('/projects/:id/tasks/:taskId/dependencies', auth, createDependency)
  fastify.delete('/projects/:id/tasks/:taskId/dependencies/:dependsOnId', auth, deleteDependency)
}
