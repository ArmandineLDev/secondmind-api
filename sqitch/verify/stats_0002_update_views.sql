-- Verify secondMind:stats_0002_update_views on pg

BEGIN;

-- Vérifie que les nouvelles colonnes sont présentes dans les vues
SELECT id, start_date, end_date, estimated_hours, total_minutes
  FROM v_project_summary WHERE false;

SELECT project_id, start_date, end_date, estimated_hours, estimated_cost, time_cost
  FROM v_project_profitability WHERE false;

ROLLBACK;
