import type { FastifyInstance } from 'fastify'
import * as contact from './contact.controller'
import * as interaction from '@/features/crm/interactions/interaction.controller'

export async function contactRoutes(fastify: FastifyInstance) {
  fastify.get('/contacts',     contact.getAll)
  fastify.post('/contacts',    contact.create)
  fastify.get('/contacts/:id', contact.getById)
  fastify.put('/contacts/:id', contact.update)
  fastify.delete('/contacts/:id', contact.remove)

  // Interactions imbriquées sous contact
  fastify.get('/contacts/:contactId/interactions',     interaction.getByContact)
  fastify.post('/contacts/:contactId/interactions',    interaction.create)
  fastify.put('/contacts/:contactId/interactions/:id', interaction.update)
  fastify.delete('/contacts/:contactId/interactions/:id', interaction.remove)
}
