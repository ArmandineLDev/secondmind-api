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

  // Consommer le fichier AVANT de lire les champs texte.
  //
  // `req.file()` résout dès l'en-tête de la part fichier : les parts qui la
  // suivent dans le flux ne sont pas encore analysées à cet instant. Lire
  // `data.fields` trop tôt donnait donc `name` et `type` à `undefined` — sauf
  // sur un fichier minuscule, qui tient dans un seul chunk et masque le
  // problème. `toBuffer()` termine le parsing et peuple `fields` en entier.
  const fileBuffer = await data.toBuffer()

  const rawMeta: Record<string, string> = {}
  for (const [key, value] of Object.entries(data.fields)) {
    // `fields` contient aussi la part fichier elle-même, sans `value`.
    const field = value as { type?: string; value?: string }
    if (field?.type === 'field' && typeof field.value === 'string') rawMeta[key] = field.value
  }

  // `.parse()` et non `.safeParse()` : le gestionnaire d'erreurs reconstruit un
  // message lisible à partir des `issues`. Renvoyer `error.message` à la main
  // affichait le dump JSON brut de la ZodError dans l'interface.
  const meta = documentMetaSchema.parse(rawMeta)

  const doc = await svc.uploadDocument(
    req.organizationId,
    meta,
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
