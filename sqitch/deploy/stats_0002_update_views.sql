-- Deploy secondMind:stats_0002_update_views to pg
-- Reconstruit v_project_summary et v_project_profitability
-- pour inclure start_date, end_date et estimated_hours des tâches

BEGIN;

DROP VIEW IF EXISTS v_project_profitability;
DROP VIEW IF EXISTS v_project_summary;

-- Résumé par projet : ajout start_date, end_date, heures estimées et réelles
CREATE VIEW v_project_summary AS
SELECT
  p.id,
  p.organization_id,
  p.name,
  p.status,
  p.is_archived,
  p.is_default,
  p.start_date,
  p.end_date,
  p.created_at,
  (SELECT COUNT(*)              FROM task t  WHERE t.project_id = p.id)                                      AS task_count,
  (SELECT COALESCE(SUM(t.estimated_hours), 0) FROM task t WHERE t.project_id = p.id)                        AS estimated_hours,
  (SELECT COALESCE(SUM(te.duration_minutes), 0) FROM time_entry te WHERE te.project_id = p.id)               AS total_minutes,
  b.planned_amount                                                                                            AS budget_amount,
  b.currency                                                                                                  AS budget_currency,
  (SELECT COALESCE(SUM(r.amount), 0) FROM revenue r WHERE r.project_id = p.id)                              AS total_revenue
FROM project p
LEFT JOIN budget b ON b.project_id = p.id;

-- Rentabilité : budget vs CA vs coût du temps + estimation
CREATE VIEW v_project_profitability AS
SELECT
  p.id               AS project_id,
  p.organization_id,
  p.name,
  p.start_date,
  p.end_date,
  b.planned_amount   AS budget,
  b.currency,
  (SELECT COALESCE(SUM(r.amount), 0)
   FROM revenue r WHERE r.project_id = p.id)                                                                AS total_revenue,
  (SELECT COALESCE(SUM(t.estimated_hours), 0)
   FROM task t WHERE t.project_id = p.id)                                                                   AS estimated_hours,
  (SELECT COALESCE(SUM(te.duration_minutes), 0)
   FROM time_entry te WHERE te.project_id = p.id)                                                           AS total_minutes,
  (SELECT COALESCE(SUM(te.duration_minutes / 60.0 * COALESCE(te.hourly_rate, 0)), 0)
   FROM time_entry te WHERE te.project_id = p.id)                                                           AS time_cost,
  -- Coût estimé par tâche (somme des heures estimées × taux horaire moyen des saisies)
  (SELECT COALESCE(
     SUM(t.estimated_hours) * NULLIF(AVG(te.hourly_rate), 0),
     0
   )
   FROM task t
   LEFT JOIN time_entry te ON te.project_id = p.id AND te.hourly_rate IS NOT NULL
   WHERE t.project_id = p.id)                                                                               AS estimated_cost
FROM project p
LEFT JOIN budget b ON b.project_id = p.id;

COMMIT;
