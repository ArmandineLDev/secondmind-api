import type { FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import * as dm from '@/db/datamappers/stats.datamapper'

const yearSchema = z.object({ year: z.coerce.number().int().optional() })

export async function getKpis(req: FastifyRequest, reply: FastifyReply) {
  const kpis = await dm.getKpis(req.organizationId)
  reply.send(kpis ?? {})
}

export async function getMonthlyRevenue(req: FastifyRequest, reply: FastifyReply) {
  const { year } = yearSchema.parse(req.query)
  const rows = await dm.getMonthlyRevenue(req.organizationId, year)
  reply.send(rows)
}

export async function getLeadPipeline(req: FastifyRequest, reply: FastifyReply) {
  const rows = await dm.getLeadPipeline(req.organizationId)
  reply.send(rows)
}

export async function getProjectProfitability(req: FastifyRequest, reply: FastifyReply) {
  const rows = await dm.getProjectProfitability(req.organizationId)
  reply.send(rows)
}

export async function getInvoiceSummary(req: FastifyRequest, reply: FastifyReply) {
  const rows = await dm.getInvoiceSummary(req.organizationId)
  reply.send(rows)
}

export async function getMarketingKpis(req: FastifyRequest, reply: FastifyReply) {
  const kpis = await dm.getMarketingKpis(req.organizationId)
  reply.send(kpis ?? {})
}
