-- Revert secondMind:stats_0004_fix_estimated_cost from pg

BEGIN;

-- Restaure v_project_profitability tel que défini en stats_0003 (estimated_cost
-- via la moyenne des taux saisis, avec le produit cartésien).

DROP VIEW IF EXISTS v_project_profitability;

CREATE VIEW v_project_profitability AS
SELECT
  p.id               AS project_id,
  p.organization_id,
  p.name,
  p.start_date,
  p.end_date,
  b.planned_amount   AS budget,
  b.currency,
  (SELECT COALESCE(SUM(i.amount), 0) FROM invoice i
   WHERE i.project_id = p.id AND i.type = 'outgoing' AND i.status = 'paid')                          AS total_revenue,
  (SELECT COALESCE(SUM(t.estimated_hours), 0)
   FROM task t WHERE t.project_id = p.id)                                                            AS estimated_hours,
  (SELECT COALESCE(SUM(te.duration_minutes), 0)
   FROM time_entry te WHERE te.project_id = p.id)                                                    AS total_minutes,
  (SELECT COALESCE(SUM(te.duration_minutes / 60.0 * COALESCE(te.hourly_rate, 0)), 0)
   FROM time_entry te WHERE te.project_id = p.id)                                                    AS time_cost,
  (SELECT COALESCE(
     SUM(t.estimated_hours) * NULLIF(AVG(te.hourly_rate), 0),
     0
   )
   FROM task t
   LEFT JOIN time_entry te ON te.project_id = p.id AND te.hourly_rate IS NOT NULL
   WHERE t.project_id = p.id)                                                                        AS estimated_cost
FROM project p
LEFT JOIN budget b ON b.project_id = p.id;

COMMIT;
