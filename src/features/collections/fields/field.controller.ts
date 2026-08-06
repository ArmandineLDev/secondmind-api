import type { FastifyRequest, FastifyReply } from 'fastify'
import { createFieldSchema, updateFieldSchema, fieldParamsSchema } from './field.schema'
import { collectionParamsSchema } from '../collection.schema'
import { resolveFieldChange, coerceValue } from '../collection.service'
import * as dm from '@/db/datamappers/collection-field.datamapper'
import { collectionBelongsToOrg } from '@/db/datamappers/collection.datamapper'

export async function getAll(req: FastifyRequest, reply: FastifyReply) {
  const { id } = collectionParamsSchema.parse(req.params)
  if (!(await collectionBelongsToOrg(id, req.organizationId))) {
    return reply.notFound('Fiche introuvable')
  }
  reply.send(await dm.findFieldsByCollection(id))
}

export async function create(req: FastifyRequest, reply: FastifyReply) {
  const { id } = collectionParamsSchema.parse(req.params)
  const input  = createFieldSchema.parse(req.body)
  if (!(await collectionBelongsToOrg(id, req.organizationId))) {
    return reply.notFound('Fiche introuvable')
  }
  const field = await dm.createField(id, input)
  reply.code(201).send(field)
}

export async function update(req: FastifyRequest, reply: FastifyReply) {
  const { id, fieldId } = fieldParamsSchema.parse(req.params)
  const input           = updateFieldSchema.parse(req.body)
  if (!(await collectionBelongsToOrg(id, req.organizationId))) {
    return reply.notFound('Fiche introuvable')
  }

  const current = await dm.findFieldById(fieldId, id)
  if (!current) return reply.notFound('Colonne introuvable')

  // Le schéma Zod ne voit que la charge utile ; l'invariant « select ⇄ options »
  // porte lui sur l'état final de la colonne. D'où cet arbitrage ici.
  const change = resolveFieldChange(current, input)
  if (!change.ok) return reply.badRequest(change.message)

  const typeChanged = change.type !== current.type
  const optionsChanged =
    change.type === 'select' && JSON.stringify(change.options) !== JSON.stringify(current.options)

  const field = await dm.updateField(
    fieldId,
    id,
    { name: input.name, position: input.position, type: change.type, options: change.options },
    // Une valeur devenue incompatible est abandonnée — pas conservée en douce :
    // un choix retiré d'un « select » ne doit plus apparaître nulle part.
    typeChanged || optionsChanged
      ? (value) => coerceValue({ ...current, type: change.type, options: change.options }, value)
      : undefined,
  )
  if (!field) return reply.notFound('Colonne introuvable')
  reply.send(field)
}

export async function remove(req: FastifyRequest, reply: FastifyReply) {
  const { id, fieldId } = fieldParamsSchema.parse(req.params)
  if (!(await collectionBelongsToOrg(id, req.organizationId))) {
    return reply.notFound('Fiche introuvable')
  }
  const deleted = await dm.deleteField(fieldId, id)
  if (!deleted) return reply.notFound('Colonne introuvable')
  reply.code(204).send()
}
