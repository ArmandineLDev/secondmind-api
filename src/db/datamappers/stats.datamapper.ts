import { db } from '@/lib/db'
import type {
  Kpis,
  MonthlyRevenue,
  OpportunityPipelineRow,
  ProjectProfitability,
  InvoiceSummaryRow,
  CommercialKpis,
  CumulativePnl,
  OfferPerformance,
  CrmDailyActivity,
} from '@/features/stats/stats.types'

export async function getKpis(organizationId: string): Promise<Kpis | null> {
  const result = await db.query<Kpis>(
    `SELECT * FROM v_kpis WHERE organization_id = $1`,
    [organizationId]
  )
  return result.rows[0] ?? null
}

export async function getMonthlyRevenue(
  organizationId: string,
  year?: number
): Promise<MonthlyRevenue[]> {
  const conditions = ['organization_id = $1']
  const params: unknown[] = [organizationId]

  if (year) {
    conditions.push(`EXTRACT(YEAR FROM month) = $2`)
    params.push(year)
  }

  const result = await db.query<MonthlyRevenue>(
    `SELECT * FROM v_monthly_revenue
     WHERE ${conditions.join(' AND ')}
     ORDER BY month ASC`,
    params
  )
  return result.rows
}

export async function getOpportunityPipeline(organizationId: string): Promise<OpportunityPipelineRow[]> {
  const result = await db.query<OpportunityPipelineRow>(
    `SELECT * FROM v_opportunity_pipeline WHERE organization_id = $1`,
    [organizationId]
  )
  return result.rows
}

export async function getProjectProfitability(organizationId: string): Promise<ProjectProfitability[]> {
  const result = await db.query<ProjectProfitability>(
    `SELECT * FROM v_project_profitability WHERE organization_id = $1 ORDER BY name ASC`,
    [organizationId]
  )
  return result.rows
}

export async function getInvoiceSummary(organizationId: string): Promise<InvoiceSummaryRow[]> {
  const result = await db.query<InvoiceSummaryRow>(
    `SELECT * FROM v_invoice_summary WHERE organization_id = $1`,
    [organizationId]
  )
  return result.rows
}

export async function getCommercialKpis(organizationId: string): Promise<CommercialKpis | null> {
  const result = await db.query<CommercialKpis>(
    `SELECT * FROM v_commercial_kpis WHERE organization_id = $1`,
    [organizationId]
  )
  return result.rows[0] ?? null
}

export async function getCumulativePnl(organizationId: string): Promise<CumulativePnl[]> {
  const result = await db.query<CumulativePnl>(
    `SELECT * FROM v_cumulative_pnl WHERE organization_id = $1 ORDER BY year ASC`,
    [organizationId]
  )
  return result.rows
}

export async function getOfferPerformance(organizationId: string): Promise<OfferPerformance[]> {
  const result = await db.query<OfferPerformance>(
    `SELECT * FROM v_offer_performance
     WHERE organization_id = $1
     ORDER BY won_value DESC, offer_name ASC NULLS LAST`,
    [organizationId]
  )
  return result.rows
}

/**
 * Activité CRM jour par jour sur une période (vue `v_crm_daily_activity`) :
 * échanges et nouveaux contacts. Les jours sans interaction sont absents.
 */
export async function findCrmDailyActivity(
  organizationId: string,
  from: string,
  to: string
): Promise<CrmDailyActivity[]> {
  const result = await db.query<CrmDailyActivity>(
    `SELECT day::text AS date, interactions::int, new_contacts::int
     FROM v_crm_daily_activity
     WHERE organization_id = $1 AND day BETWEEN $2 AND $3
     ORDER BY day`,
    [organizationId, from, to]
  )
  return result.rows
}
