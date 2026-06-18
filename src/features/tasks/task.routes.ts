import type { FastifyInstance } from 'fastify'
import { getTasks, patchTask, relocateTask, removeTask } from '@/features/tasks/task.controller'

export async function taskRoutes(fastify: FastifyInstance) {
  const auth = { onRequest: [fastify.authenticate] }

  // Vue globale de toutes les tâches du workspace (avec filtres optionnels)
  fastify.get('/tasks', auth, getTasks)

  // Actions sur une tâche individuelle (toutes portées par le projet parent)
  fastify.put('/projects/:id/tasks/:taskId', auth, patchTask)
  fastify.patch('/projects/:id/tasks/:taskId/move', auth, relocateTask)
  fastify.delete('/projects/:id/tasks/:taskId', auth, removeTask)
}
