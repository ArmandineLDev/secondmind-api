import { db } from '@/lib/db'
import type {
  Kpis,
  MonthlyRevenue,
  LeadPipelineRow,
  ProjectProfitability,
  InvoiceSummaryRow,
  MarketingKpis,
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

export async function getLeadPipeline(organizationId: string): Promise<LeadPipelineRow[]> {
  const result = await db.query<LeadPipelineRow>(
    `SELECT * FROM v_lead_pipeline WHERE organization_id = $1`,
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

export async function getMarketingKpis(organizationId: string): Promise<MarketingKpis | null> {
  const result = await db.query<MarketingKpis>(
    `SELECT * FROM v_marketing_kpis WHERE organization_id = $1`,
    [organizationId]
  )
  return result.rows[0] ?? null
}
