import type { FastifyInstance } from 'fastify'
import * as post from './editorial-post.controller'

export async function editorialPostRoutes(fastify: FastifyInstance) {
  // Routes métier : réservées à l'owner du workspace (cf. auth.plugin.ts).
  const auth = { onRequest: [fastify.authenticate, fastify.requireOwner] }

  fastify.get('/editorial-posts', auth,     post.getAll)
  fastify.post('/editorial-posts', auth,    post.create)
  fastify.get('/editorial-posts/:id', auth, post.getById)
  fastify.put('/editorial-posts/:id', auth, post.update)
  fastify.delete('/editorial-posts/:id', auth, post.remove)
}
