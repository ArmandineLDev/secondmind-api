import type { FastifyInstance } from 'fastify'
import {
  getProjects,
  getProject,
  createProject,
  patchProject,
  toggleArchiveProject,
  removeProject,
} from '@/features/projects/project.controller'
import { getColumns, addColumn, patchColumn, removeColumn, reorder } from '@/features/projects/columns/column.controller'
import { getProjectTasks, addTask } from '@/features/tasks/task.controller'

export async function projectRoutes(fastify: FastifyInstance) {
  const auth = { onRequest: [fastify.authenticate] }

  fastify.get('/projects', auth, getProjects)
  fastify.post('/projects', auth, createProject)
  fastify.get('/projects/:id', auth, getProject)
  fastify.put('/projects/:id', auth, patchProject)
  fastify.patch('/projects/:id/archive', auth, toggleArchiveProject)
  fastify.delete('/projects/:id', auth, removeProject)

  // Colonnes
  fastify.get('/projects/:id/columns', auth, getColumns)
  fastify.post('/projects/:id/columns', auth, addColumn)
  fastify.put('/projects/:id/columns/:colId', auth, patchColumn)
  fastify.delete('/projects/:id/columns/:colId', auth, removeColumn)
  fastify.patch('/projects/:id/columns/reorder', auth, reorder)

  // Tâches par projet
  fastify.get('/projects/:id/tasks', auth, getProjectTasks)
  fastify.post('/projects/:id/tasks', auth, addTask)
}
