import type { FastifyInstance } from 'fastify'
import * as collection from './collection.controller'
import * as field from './fields/field.controller'
import * as item from './items/item.controller'

export async function collectionRoutes(fastify: FastifyInstance) {
  // Module réservé à l'owner : les fiches sont l'espace de travail interne du
  // freelance, jamais exposé aux comptes client (cf. auth.plugin.ts).
  const auth = { onRequest: [fastify.authenticate, fastify.requireOwner] }

  fastify.get('/collections', auth,        collection.getAll)
  fastify.post('/collections', auth,       collection.create)
  fastify.get('/collections/:id', auth,    collection.getById)
  fastify.put('/collections/:id', auth,    collection.update)
  fastify.delete('/collections/:id', auth, collection.remove)

  // Colonnes — imbriquées : une définition de champ n'a aucun sens hors de sa fiche.
  fastify.get('/collections/:id/fields', auth,             field.getAll)
  fastify.post('/collections/:id/fields', auth,            field.create)
  fastify.put('/collections/:id/fields/:fieldId', auth,    field.update)
  fastify.delete('/collections/:id/fields/:fieldId', auth, field.remove)

  // Entrées (lignes).
  fastify.get('/collections/:id/items', auth,            item.getAll)
  fastify.post('/collections/:id/items', auth,           item.create)
  fastify.put('/collections/:id/items/:itemId', auth,    item.update)
  fastify.delete('/collections/:id/items/:itemId', auth, item.remove)
}
