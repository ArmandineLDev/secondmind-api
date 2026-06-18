import type { FastifyRequest, FastifyReply } from 'fastify'
import { createInvoiceSchema, updateInvoiceSchema, invoiceParamsSchema, invoiceQuerySchema } from './invoice.schema'
import * as dm from '@/db/datamappers/invoice.datamapper'

export async function getAll(req: FastifyRequest, reply: FastifyReply) {
  const query = invoiceQuerySchema.parse(req.query)
  reply.send(await dm.findAllInvoices(req.organizationId, query))
}

export async function getById(req: FastifyRequest, reply: FastifyReply) {
  const { id } = invoiceParamsSchema.parse(req.params)
  const invoice = await dm.findInvoiceById(id, req.organizationId)
  if (!invoice) return reply.notFound('Facture introuvable')
  reply.send(invoice)
}

export async function create(req: FastifyRequest, reply: FastifyReply) {
  const input = createInvoiceSchema.parse(req.body)
  reply.code(201).send(await dm.createInvoice(req.organizationId, input))
}

export async function update(req: FastifyRequest, reply: FastifyReply) {
  const { id } = invoiceParamsSchema.parse(req.params)
  const input = updateInvoiceSchema.parse(req.body)
  const invoice = await dm.updateInvoice(id, req.organizationId, input)
  if (!invoice) return reply.notFound('Facture introuvable')
  reply.send(invoice)
}

export async function remove(req: FastifyRequest, reply: FastifyReply) {
  const { id } = invoiceParamsSchema.parse(req.params)
  if (!await dm.deleteInvoice(id, req.organizationId)) return reply.notFound('Facture introuvable')
  reply.code(204).send()
}
