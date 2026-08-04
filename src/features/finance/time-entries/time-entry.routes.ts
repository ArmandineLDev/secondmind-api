import type { FastifyInstance } from 'fastify'
import * as timeEntry from './time-entry.controller'

export async function timeEntryRoutes(fastify: FastifyInstance) {
  // Routes métier : réservées à l'owner du workspace (cf. auth.plugin.ts).
  const auth = { onRequest: [fastify.authenticate, fastify.requireOwner] }

  fastify.get('/time-entries', auth,     timeEntry.getAll)
  fastify.post('/time-entries', auth,    timeEntry.create)
  fastify.get('/time-entries/:id', auth, timeEntry.getById)
  fastify.put('/time-entries/:id', auth, timeEntry.update)
  fastify.delete('/time-entries/:id', auth, timeEntry.remove)
}
