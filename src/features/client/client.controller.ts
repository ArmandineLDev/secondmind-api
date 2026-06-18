import type { FastifyRequest, FastifyReply } from 'fastify'
import { z }                                 from 'zod'
import * as dm                               from '@/db/datamappers/client.datamapper'
import { getSignedDownloadUrl }              from '@/features/documents/document.service'

const paramsId    = z.object({ id: z.string().uuid() })
const projectParams = z.object({ projectId: z.string().uuid() })

export async function getProjects(req: FastifyRequest, reply: FastifyReply) {
  const projects = await dm.findClientProjects(req.session.user.id)
  reply.send(projects)
}

export async function getProjectById(req: FastifyRequest, reply: FastifyReply) {
  const { id } = paramsId.parse(req.params)
  const project = await dm.findClientProjectById(id, req.session.user.id)
  if (!project) return reply.notFound('Projet introuvable')

  const [columns, tasks] = await Promise.all([
    dm.findClientProjectColumns(id, req.session.user.id),
    dm.findClientProjectTasks(id, req.session.user.id),
  ])
  reply.send({ ...project, columns, tasks })
}

export async function getDocuments(req: FastifyRequest, reply: FastifyReply) {
  const docs = await dm.findClientDocuments(req.session.user.id)
  reply.send(docs)
}

export async function getDocumentUrl(req: FastifyRequest, reply: FastifyReply) {
  const { id } = paramsId.parse(req.params)
  const doc    = await dm.findClientDocumentById(id, req.session.user.id)
  if (!doc) return reply.notFound('Document introuvable')
  const url = await getSignedDownloadUrl(doc)
  reply.send({ url })
}
