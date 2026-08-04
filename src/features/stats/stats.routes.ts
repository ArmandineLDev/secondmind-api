import type { FastifyInstance } from 'fastify'
import * as stats from './stats.controller'

export async function statsRoutes(fastify: FastifyInstance) {
  // Routes métier : réservées à l'owner du workspace (cf. auth.plugin.ts).
  const auth = { onRequest: [fastify.authenticate, fastify.requireOwner] }

  fastify.get('/stats/kpis', auth,         stats.getKpis)
  fastify.get('/stats/revenue', auth,      stats.getMonthlyRevenue)
  fastify.get('/stats/pipeline', auth,     stats.getOpportunityPipeline)
  fastify.get('/stats/projects', auth,     stats.getProjectProfitability)
  fastify.get('/stats/invoices', auth,     stats.getInvoiceSummary)
  fastify.get('/stats/marketing', auth,    stats.getMarketingKpis)
  fastify.get('/stats/cumulative', auth,   stats.getCumulativePnl)
  fastify.get('/stats/offers', auth,       stats.getOfferPerformance)
}
