-- Revert secondMind:stats_0001_views from pg

BEGIN;

DROP VIEW IF EXISTS v_marketing_kpis;
DROP VIEW IF EXISTS v_kpis;
DROP VIEW IF EXISTS v_invoice_summary;
DROP VIEW IF EXISTS v_project_profitability;
DROP VIEW IF EXISTS v_monthly_revenue;
DROP VIEW IF EXISTS v_lead_pipeline;
DROP VIEW IF EXISTS v_project_summary;

COMMIT;
