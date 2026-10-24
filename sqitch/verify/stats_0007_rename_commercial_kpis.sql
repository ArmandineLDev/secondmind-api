-- Verify secondMind:stats_0007_rename_commercial_kpis on pg

BEGIN;

SELECT organization_id FROM v_commercial_kpis WHERE false;

ROLLBACK;
