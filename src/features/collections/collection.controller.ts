import type { FastifyRequest, FastifyReply } from 'fastify'
import {
  createCollectionSchema,
  updateCollectionSchema,
  collectionParamsSchema,
  collectionQuerySchema,
} from './collection.schema'
import * as dm from '@/db/datamappers/collection.datamapper'
import { findProjectById } from '@/db/datamappers/project.datamapper'

/**
 * La clé étrangère `collection.project_id` ne vérifie que l'existence du projet,
 * pas son appartenance au workspace : sans ce contrôle, un id deviné suffirait à
 * rattacher une fiche au projet d'un autre workspace.
 */
async function projectIsForeign(projectId: string | null | undefined, organizationId: string) {
  if (!projectId) return false
  return (await findProjectById(projectId, organizationId)) === null
}

export async function getAll(req: FastifyRequest, reply: FastifyReply) {
  const query       = collectionQuerySchema.parse(req.query)
  const collections = await dm.findAllCollections(req.organizationId, query)
  reply.send(collections)
}

export async function getById(req: FastifyRequest, reply: FastifyReply) {
  const { id }     = collectionParamsSchema.parse(req.params)
  const collection = await dm.findCollectionById(id, req.organizationId)
  if (!collection) return reply.notFound('Fiche introuvable')
  reply.send(collection)
}

export async function create(req: FastifyRequest, reply: FastifyReply) {
  const input = createCollectionSchema.parse(req.body)
  if (await projectIsForeign(input.project_id, req.organizationId)) {
    return reply.badRequest('Projet introuvable')
  }
  const collection = await dm.createCollection(req.organizationId, input)
  reply.code(201).send(collection)
}

export async function update(req: FastifyRequest, reply: FastifyReply) {
  const { id } = collectionParamsSchema.parse(req.params)
  const input  = updateCollectionSchema.parse(req.body)
  if (await projectIsForeign(input.project_id, req.organizationId)) {
    return reply.badRequest('Projet introuvable')
  }
  const collection = await dm.updateCollection(id, req.organizationId, input)
  if (!collection) return reply.notFound('Fiche introuvable')
  reply.send(collection)
}

export async function remove(req: FastifyRequest, reply: FastifyReply) {
  const { id }  = collectionParamsSchema.parse(req.params)
  const deleted = await dm.deleteCollection(id, req.organizationId)
  if (!deleted) return reply.notFound('Fiche introuvable')
  reply.code(204).send()
}
