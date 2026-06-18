import type { FastifyRequest, FastifyReply } from 'fastify'
import { createCompanySchema, updateCompanySchema, companyParamsSchema } from './company.schema'
import * as dm from '@/db/datamappers/company.datamapper'

export async function getAll(req: FastifyRequest, reply: FastifyReply) {
  const companies = await dm.findAllCompanies(req.organizationId)
  reply.send(companies)
}

export async function getById(req: FastifyRequest, reply: FastifyReply) {
  const { id } = companyParamsSchema.parse(req.params)
  const company = await dm.findCompanyById(id, req.organizationId)
  if (!company) return reply.notFound('Entreprise introuvable')
  reply.send(company)
}

export async function create(req: FastifyRequest, reply: FastifyReply) {
  const input = createCompanySchema.parse(req.body)
  const company = await dm.createCompany(req.organizationId, input)
  reply.code(201).send(company)
}

export async function update(req: FastifyRequest, reply: FastifyReply) {
  const { id } = companyParamsSchema.parse(req.params)
  const input = updateCompanySchema.parse(req.body)
  const company = await dm.updateCompany(id, req.organizationId, input)
  if (!company) return reply.notFound('Entreprise introuvable')
  reply.send(company)
}

export async function remove(req: FastifyRequest, reply: FastifyReply) {
  const { id } = companyParamsSchema.parse(req.params)
  const deleted = await dm.deleteCompany(id, req.organizationId)
  if (!deleted) return reply.notFound('Entreprise introuvable')
  reply.code(204).send()
}
