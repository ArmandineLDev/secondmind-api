import type { FastifyRequest, FastifyReply } from 'fastify'
import { documentMetaSchema, documentParamsSchema, documentQuerySchema } from './document.schema'
import * as dm from '@/db/datamappers/document.datamapper'
import * as svc from './document.service'

export async function getAll(req: FastifyRequest, reply: FastifyReply) {
  const query = documentQuerySchema.parse(req.query)
  const docs  = await dm.findAllDocuments(req.organizationId, query)
  reply.send(docs)
}

export async function getById(req: FastifyRequest, reply: FastifyReply) {
  const { id } = documentParamsSchema.parse(req.params)
  const doc    = await dm.findDocumentById(id, req.organizationId)
  if (!doc) return reply.notFound('Document introuvable')
  reply.send(doc)
}

export async function upload(req: FastifyRequest, reply: FastifyReply) {
  const data = await req.file()
  if (!data) return reply.badRequest('Aucun fichier fourni')

  if (!svc.isMimeTypeAllowed(data.mimetype)) {
    return reply.badRequest('Type de fichier non autorisé')
  }

  const rawMeta: Record<string, string> = {}
  for (const [key, value] of Object.entries(data.fields)) {
    const field = value as { value: string }
    rawMeta[key] = field.value
  }

  const metaResult = documentMetaSchema.safeParse(rawMeta)
  if (!metaResult.success) {
    return reply.badRequest(metaResult.error.message)
  }

  const fileBuffer = await data.toBuffer()
  const doc = await svc.uploadDocument(
    req.organizationId,
    req.session.user.id,
    metaResult.data,
    fileBuffer,
    data.mimetype,
    fileBuffer.length,
  )
  reply.code(201).send(doc)
}

export async function getSignedUrl(req: FastifyRequest, reply: FastifyReply) {
  const { id } = documentParamsSchema.parse(req.params)
  const doc    = await dm.findDocumentById(id, req.organizationId)
  if (!doc) return reply.notFound('Document introuvable')
  const url = await svc.getSignedDownloadUrl(doc)
  reply.send({ url })
}

export async function remove(req: FastifyRequest, reply: FastifyReply) {
  const { id } = documentParamsSchema.parse(req.params)
  const deleted = await svc.removeDocument(id, req.organizationId)
  if (!deleted) return reply.notFound('Document introuvable')
  reply.code(204).send()
}
