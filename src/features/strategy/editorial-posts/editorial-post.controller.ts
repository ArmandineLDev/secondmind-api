import type { FastifyRequest, FastifyReply } from 'fastify'
import {
  createPostSchema,
  updatePostSchema,
  postParamsSchema,
  postQuerySchema,
} from './editorial-post.schema'
import * as dm from '@/db/datamappers/editorial-post.datamapper'

export async function getAll(req: FastifyRequest, reply: FastifyReply) {
  const query = postQuerySchema.parse(req.query)
  const posts = await dm.findAllPosts(req.organizationId, query)
  reply.send(posts)
}

export async function getById(req: FastifyRequest, reply: FastifyReply) {
  const { id } = postParamsSchema.parse(req.params)
  const post = await dm.findPostById(id, req.organizationId)
  if (!post) return reply.notFound('Post introuvable')
  reply.send(post)
}

export async function create(req: FastifyRequest, reply: FastifyReply) {
  const input = createPostSchema.parse(req.body)
  const post = await dm.createPost(req.organizationId, input)
  reply.code(201).send(post)
}

export async function update(req: FastifyRequest, reply: FastifyReply) {
  const { id } = postParamsSchema.parse(req.params)
  const input = updatePostSchema.parse(req.body)
  const post = await dm.updatePost(id, req.organizationId, input)
  if (!post) return reply.notFound('Post introuvable')
  reply.send(post)
}

export async function remove(req: FastifyRequest, reply: FastifyReply) {
  const { id } = postParamsSchema.parse(req.params)
  const deleted = await dm.deletePost(id, req.organizationId)
  if (!deleted) return reply.notFound('Post introuvable')
  reply.code(204).send()
}
