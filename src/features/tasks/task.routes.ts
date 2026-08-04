import type { FastifyInstance } from 'fastify'
import { getTasks, patchTask, relocateTask, rescheduleRecurringTask, removeTask } from '@/features/tasks/task.controller'

export async function taskRoutes(fastify: FastifyInstance) {
  // Routes métier : réservées à l'owner du workspace (cf. auth.plugin.ts).
  const auth = { onRequest: [fastify.authenticate, fastify.requireOwner] }

  // Vue globale de toutes les tâches du workspace (avec filtres optionnels)
  fastify.get('/tasks', auth, getTasks)

  // Actions sur une tâche individuelle (toutes portées par le projet parent)
  fastify.put('/projects/:id/tasks/:taskId', auth, patchTask)
  fastify.patch('/projects/:id/tasks/:taskId/move', auth, relocateTask)
  fastify.patch('/projects/:id/tasks/:taskId/reschedule', auth, rescheduleRecurringTask)
  fastify.delete('/projects/:id/tasks/:taskId', auth, removeTask)
}
