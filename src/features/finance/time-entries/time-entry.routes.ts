import type { FastifyInstance } from 'fastify'
import * as timeEntry from './time-entry.controller'

export async function timeEntryRoutes(fastify: FastifyInstance) {
  fastify.get('/time-entries',     timeEntry.getAll)
  fastify.post('/time-entries',    timeEntry.create)
  fastify.get('/time-entries/:id', timeEntry.getById)
  fastify.put('/time-entries/:id', timeEntry.update)
  fastify.delete('/time-entries/:id', timeEntry.remove)
}
