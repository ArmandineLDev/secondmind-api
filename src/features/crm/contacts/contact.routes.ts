import type { FastifyInstance } from 'fastify'
import * as contact from './contact.controller'
import * as interaction from '@/features/crm/interactions/interaction.controller'

export async function contactRoutes(fastify: FastifyInstance) {
  const auth = { onRequest: [fastify.authenticate] }

  fastify.get('/contacts', auth,     contact.getAll)
  fastify.post('/contacts', auth,    contact.create)
  fastify.get('/contacts/:id', auth, contact.getById)
  fastify.put('/contacts/:id', auth, contact.update)
  fastify.delete('/contacts/:id', auth, contact.remove)

  // Interactions imbriquées sous contact
  fastify.get('/contacts/:contactId/interactions', auth,     interaction.getByContact)
  fastify.post('/contacts/:contactId/interactions', auth,    interaction.create)
  fastify.put('/contacts/:contactId/interactions/:id', auth, interaction.update)
  fastify.delete('/contacts/:contactId/interactions/:id', auth, interaction.remove)
}
