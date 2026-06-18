import type { FastifyInstance } from 'fastify'
import * as s from './settings.controller'

export async function settingsRoutes(fastify: FastifyInstance) {
  fastify.get('/settings/preferences',                            s.getPreferences)
  fastify.put('/settings/preferences',                            s.updatePreferences)

  fastify.get('/settings/clients',                                s.listClients)
  fastify.post('/settings/clients',                               s.addClient)
  fastify.delete('/settings/clients/:memberId',                   s.removeClient)

  fastify.post('/settings/clients/:memberId/projects',            s.assignProject)
  fastify.delete('/settings/clients/:memberId/projects/:projectId', s.unassignProject)
}
