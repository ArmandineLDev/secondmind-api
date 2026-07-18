import type { FastifyInstance } from 'fastify'
import * as stats from './stats.controller'

export async function statsRoutes(fastify: FastifyInstance) {
  const auth = { onRequest: [fastify.authenticate] }

  fastify.get('/stats/kpis', auth,         stats.getKpis)
  fastify.get('/stats/revenue', auth,      stats.getMonthlyRevenue)
  fastify.get('/stats/pipeline', auth,     stats.getLeadPipeline)
  fastify.get('/stats/projects', auth,     stats.getProjectProfitability)
  fastify.get('/stats/invoices', auth,     stats.getInvoiceSummary)
  fastify.get('/stats/marketing', auth,    stats.getMarketingKpis)
  fastify.get('/stats/cumulative', auth,   stats.getCumulativePnl)
}
