import type { FastifyInstance } from 'fastify'
import * as timeEntry from './time-entry.controller'

export async function timeEntryRoutes(fastify: FastifyInstance) {
  const auth = { onRequest: [fastify.authenticate] }

  fastify.get('/time-entries', auth,     timeEntry.getAll)
  fastify.post('/time-entries', auth,    timeEntry.create)
  fastify.get('/time-entries/:id', auth, timeEntry.getById)
  fastify.put('/time-entries/:id', auth, timeEntry.update)
  fastify.delete('/time-entries/:id', auth, timeEntry.remove)
}
