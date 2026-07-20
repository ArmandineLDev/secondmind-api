-- Verify secondMind:stats_0005_rename_lead_views on pg

BEGIN;

SELECT organization_id, open_opportunities FROM v_kpis WHERE FALSE;
SELECT organization_id, stage, opportunity_count, total_value, avg_probability FROM v_opportunity_pipeline WHERE FALSE;
SELECT organization_id, total_opportunities, opportunities_with_interaction, won_opportunities, won_value FROM v_marketing_kpis WHERE FALSE;

ROLLBACK;
