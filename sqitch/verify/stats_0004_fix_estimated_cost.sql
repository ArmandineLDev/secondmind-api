-- Verify secondMind:stats_0004_fix_estimated_cost on pg

BEGIN;

SELECT project_id, estimated_cost
  FROM v_project_profitability WHERE false;

ROLLBACK;
