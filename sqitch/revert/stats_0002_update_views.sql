-- Revert secondMind:stats_0002_update_views from pg
-- Restaure les versions originales de v_project_summary et v_project_profitability

BEGIN;

DROP VIEW IF EXISTS v_project_profitability;
DROP VIEW IF EXISTS v_project_summary;

-- Version originale de v_project_summary (sans start_date, end_date, estimated_hours)
CREATE VIEW v_project_summary AS
SELECT
  p.id,
  p.organization_id,
  p.name,
  p.status,
  p.is_archived,
  p.is_default,
  p.created_at,
  (SELECT COUNT(*) FROM task t WHERE t.project_id = p.id)                                               AS task_count,
  b.planned_amount                                                                                        AS budget_amount,
  b.currency                                                                                              AS budget_currency,
  (SELECT COALESCE(SUM(r.amount), 0) FROM revenue r WHERE r.project_id = p.id)                          AS total_revenue,
  (SELECT COALESCE(SUM(te.duration_minutes), 0) FROM time_entry te WHERE te.project_id = p.id)          AS total_minutes
FROM project p
LEFT JOIN budget b ON b.project_id = p.id;

-- Version originale de v_project_profitability (sans estimated_hours, estimated_cost)
CREATE VIEW v_project_profitability AS
SELECT
  p.id               AS project_id,
  p.organization_id,
  p.name,
  b.planned_amount   AS budget,
  b.currency,
  (SELECT COALESCE(SUM(r.amount), 0)
   FROM revenue r WHERE r.project_id = p.id)                                                        AS total_revenue,
  (SELECT COALESCE(SUM(te.duration_minutes), 0)
   FROM time_entry te WHERE te.project_id = p.id)                                                   AS total_minutes,
  (SELECT COALESCE(SUM(te.duration_minutes / 60.0 * COALESCE(te.hourly_rate, 0)), 0)
   FROM time_entry te WHERE te.project_id = p.id)                                                   AS time_cost
FROM project p
LEFT JOIN budget b ON b.project_id = p.id;

COMMIT;
