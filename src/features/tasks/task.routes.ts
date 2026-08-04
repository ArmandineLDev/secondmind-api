import type { FastifyInstance } from 'fastify'
import {
  getTasks, patchTask, relocateTask, rescheduleRecurringTask, removeTask,
  captureTask, triage, assign,
} from '@/features/tasks/task.controller'

export async function taskRoutes(fastify: FastifyInstance) {
  // Routes métier : réservées à l'owner du workspace (cf. auth.plugin.ts).
  const auth = { onRequest: [fastify.authenticate, fastify.requireOwner] }

  // Vue globale de toutes les tâches du workspace
  // Filtres : project_id, priority, column_id, stage.
  // ?stage=inbox masque les tâches différées dont la date n'est pas atteinte.
  fastify.get('/tasks', auth, getTasks)

  // ── Capture / Inbox (functional-spec §3.9) ────────────────────────────────
  // Ces routes ne sont PAS imbriquées sous un projet : à ce stade la tâche n'en
  // a pas encore. C'est précisément ce que la feature rend possible.
  fastify.post('/tasks', auth, captureTask)                 // capture : { title }
  fastify.patch('/tasks/:taskId/triage', auth, triage)      // valider / différer / annuler
  fastify.patch('/tasks/:taskId/assign', auth, assign)      // poser sur un board

  // Actions sur une tâche individuelle (toutes portées par le projet parent)
  fastify.put('/projects/:id/tasks/:taskId', auth, patchTask)
  fastify.patch('/projects/:id/tasks/:taskId/move', auth, relocateTask)
  fastify.patch('/projects/:id/tasks/:taskId/reschedule', auth, rescheduleRecurringTask)
  fastify.delete('/projects/:id/tasks/:taskId', auth, removeTask)
}
