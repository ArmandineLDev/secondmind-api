import type { FastifyInstance } from 'fastify'
import * as s from './settings.controller'

export async function settingsRoutes(fastify: FastifyInstance) {
  const auth = { onRequest: [fastify.authenticate] }

  fastify.get('/settings/preferences', auth,                            s.getPreferences)
  fastify.put('/settings/preferences', auth,                            s.updatePreferences)

  fastify.get('/settings/clients', auth,                                s.listClients)
  fastify.post('/settings/clients', auth,                               s.addClient)
  fastify.delete('/settings/clients/:memberId', auth,                   s.removeClient)

  fastify.post('/settings/clients/:memberId/projects', auth,            s.assignProject)
  fastify.delete('/settings/clients/:memberId/projects/:projectId', auth, s.unassignProject)
}
