import type { FastifyInstance } from 'fastify'
import * as contact from './contact.controller'
import * as interaction from '@/features/crm/interactions/interaction.controller'
import * as socialLink from './social-link.controller'

export async function contactRoutes(fastify: FastifyInstance) {
  // Routes métier : réservées à l'owner du workspace (cf. auth.plugin.ts).
  const auth = { onRequest: [fastify.authenticate, fastify.requireOwner] }

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

  // Liens réseaux sociaux imbriqués sous contact
  fastify.get('/contacts/:contactId/social-links', auth,     socialLink.getByContact)
  fastify.post('/contacts/:contactId/social-links', auth,    socialLink.create)
  fastify.put('/contacts/:contactId/social-links/:id', auth, socialLink.update)
  fastify.delete('/contacts/:contactId/social-links/:id', auth, socialLink.remove)
}
