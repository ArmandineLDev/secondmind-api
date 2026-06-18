import type { FastifyInstance } from 'fastify'
import * as stats from './stats.controller'

export async function statsRoutes(fastify: FastifyInstance) {
  fastify.get('/stats/kpis',         stats.getKpis)
  fastify.get('/stats/revenue',      stats.getMonthlyRevenue)
  fastify.get('/stats/pipeline',     stats.getLeadPipeline)
  fastify.get('/stats/projects',     stats.getProjectProfitability)
  fastify.get('/stats/invoices',     stats.getInvoiceSummary)
  fastify.get('/stats/marketing',    stats.getMarketingKpis)
}
