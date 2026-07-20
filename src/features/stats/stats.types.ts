export interface Kpis {
  organization_id:  string
  active_projects:  string
  archived_projects: string
  revenue_ytd:      string
  expenses_ytd:     string
  open_opportunities: string
  receivables:      string
  payables:         string
}

export interface MonthlyRevenue {
  organization_id: string
  month:           string
  currency:        string
  total:           string
}

export interface OpportunityPipelineRow {
  organization_id:  string
  stage:            string
  opportunity_count: string
  total_value:      string
  avg_probability:  string
}

export interface ProjectProfitability {
  project_id:     string
  organization_id: string
  name:           string
  start_date:     string | null
  end_date:       string | null
  budget:         string | null
  currency:       string | null
  total_revenue:  string
  estimated_hours: string
  total_minutes:  string
  time_cost:      string
  estimated_cost: string
}

export interface InvoiceSummaryRow {
  organization_id: string
  type:            string
  pending_amount:  string
  overdue_amount:  string
  open_count:      string
}

export interface MarketingKpis {
  organization_id:                string
  total_opportunities:            string
  opportunities_with_interaction: string
  won_opportunities:              string
  won_value:                      string
}

export interface CumulativePnl {
  organization_id: string
  year:            number
  revenue:         string
  expenses:        string
  net:             string
  cumulative_net:  string
}
