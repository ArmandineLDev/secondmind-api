-- Verify secondMind:stats_0001_views on pg

BEGIN;

-- Existence et colonnes des vues
SELECT id, organization_id, name, status, is_archived, task_count, budget_amount, total_revenue, total_minutes
  FROM v_project_summary WHERE false;

SELECT organization_id, stage, lead_count, total_value, avg_probability
  FROM v_lead_pipeline WHERE false;

SELECT organization_id, month, currency, total
  FROM v_monthly_revenue WHERE false;

SELECT project_id, organization_id, name, budget, total_revenue, total_minutes, time_cost
  FROM v_project_profitability WHERE false;

SELECT organization_id, type, pending_amount, overdue_amount, open_count
  FROM v_invoice_summary WHERE false;

SELECT organization_id, active_projects, archived_projects, revenue_ytd, expenses_ytd, open_leads, receivables, payables
  FROM v_kpis WHERE false;

SELECT organization_id, total_leads, leads_with_interaction, won_leads, won_value
  FROM v_marketing_kpis WHERE false;

-- Vérification que toutes les vues existent bien dans pg_views
DO $$
DECLARE missing text;
BEGIN
  SELECT string_agg(v, ', ') INTO missing
  FROM unnest(ARRAY[
    'v_project_summary',
    'v_lead_pipeline',
    'v_monthly_revenue',
    'v_project_profitability',
    'v_invoice_summary',
    'v_kpis',
    'v_marketing_kpis'
  ]) AS v
  WHERE NOT EXISTS (
    SELECT 1 FROM pg_views WHERE schemaname = 'public' AND viewname = v
  );
  IF missing IS NOT NULL THEN
    RAISE EXCEPTION 'Vue(s) manquante(s) : %', missing;
  END IF;
END $$;

ROLLBACK;
