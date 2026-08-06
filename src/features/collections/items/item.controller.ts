import type { FastifyRequest, FastifyReply } from 'fastify'
import { createItemSchema, updateItemSchema, itemParamsSchema } from './item.schema'
import { collectionParamsSchema } from '../collection.schema'
import { validateItemData } from '../collection.service'
import * as dm from '@/db/datamappers/collection-item.datamapper'
import { findFieldsByCollection } from '@/db/datamappers/collection-field.datamapper'
import { collectionBelongsToOrg } from '@/db/datamappers/collection.datamapper'

export async function getAll(req: FastifyRequest, reply: FastifyReply) {
  const { id } = collectionParamsSchema.parse(req.params)
  if (!(await collectionBelongsToOrg(id, req.organizationId))) {
    return reply.notFound('Fiche introuvable')
  }
  reply.send(await dm.findItemsByCollection(id))
}

export async function create(req: FastifyRequest, reply: FastifyReply) {
  const { id } = collectionParamsSchema.parse(req.params)
  const input  = createItemSchema.parse(req.body)
  if (!(await collectionBelongsToOrg(id, req.organizationId))) {
    return reply.notFound('Fiche introuvable')
  }

  const fields = await findFieldsByCollection(id)
  const result = validateItemData(fields, input.data ?? {})
  if (!result.ok) return reply.badRequest(result.message)

  const item = await dm.createItem(id, result.data)
  reply.code(201).send(item)
}

export async function update(req: FastifyRequest, reply: FastifyReply) {
  const { id, itemId } = itemParamsSchema.parse(req.params)
  const input          = updateItemSchema.parse(req.body)
  if (!(await collectionBelongsToOrg(id, req.organizationId))) {
    return reply.notFound('Fiche introuvable')
  }

  const fields = await findFieldsByCollection(id)
  const result = validateItemData(fields, input.data)
  if (!result.ok) return reply.badRequest(result.message)

  // Remplacement intégral : l'éditeur renvoie toujours la ligne entière, sans
  // quoi vider une cellule serait impossible (cf. le datamapper).
  const item = await dm.updateItem(itemId, id, result.data)
  if (!item) return reply.notFound('Entrée introuvable')
  reply.send(item)
}

export async function remove(req: FastifyRequest, reply: FastifyReply) {
  const { id, itemId } = itemParamsSchema.parse(req.params)
  if (!(await collectionBelongsToOrg(id, req.organizationId))) {
    return reply.notFound('Fiche introuvable')
  }
  const deleted = await dm.deleteItem(itemId, id)
  if (!deleted) return reply.notFound('Entrée introuvable')
  reply.code(204).send()
}
