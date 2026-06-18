import type { FastifyInstance } from 'fastify'
import * as post from './editorial-post.controller'

export async function editorialPostRoutes(fastify: FastifyInstance) {
  fastify.get('/editorial-posts',     post.getAll)
  fastify.post('/editorial-posts',    post.create)
  fastify.get('/editorial-posts/:id', post.getById)
  fastify.put('/editorial-posts/:id', post.update)
  fastify.delete('/editorial-posts/:id', post.remove)
}
