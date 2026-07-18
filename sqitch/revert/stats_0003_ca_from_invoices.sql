-- Revert secondMind:stats_0003_ca_from_invoices from pg

BEGIN;

-- Restaure l'état antérieur : CA lu depuis la table `revenue` (versions stats_0001/0002).

DROP VIEW IF EXISTS v_cumulative_pnl;
DROP VIEW IF EXISTS v_kpis;
DROP VIEW IF EXISTS v_monthly_revenue;
DROP VIEW IF EXISTS v_project_profitability;
DROP VIEW IF EXISTS v_project_summary;

-- v_project_summary (version stats_0002)
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

-- v_project_profitability (version stats_0002)
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
  (SELECT COALESCE(
     SUM(t.estimated_hours) * NULLIF(AVG(te.hourly_rate), 0),
     0
   )
   FROM task t
   LEFT JOIN time_entry te ON te.project_id = p.id AND te.hourly_rate IS NOT NULL
   WHERE t.project_id = p.id)                                                                               AS estimated_cost
FROM project p
LEFT JOIN budget b ON b.project_id = p.id;

-- v_monthly_revenue (version stats_0001)
CREATE VIEW v_monthly_revenue AS
SELECT
  organization_id,
  DATE_TRUNC('month', date) AS month,
  currency,
  SUM(amount)               AS total
FROM revenue
GROUP BY organization_id, DATE_TRUNC('month', date), currency;

-- v_kpis (version stats_0001)
CREATE VIEW v_kpis AS
SELECT
  o.id                                                                                                                    AS organization_id,
  (SELECT COUNT(*) FROM project p WHERE p.organization_id = o.id AND NOT p.is_archived)                                  AS active_projects,
  (SELECT COUNT(*) FROM project p WHERE p.organization_id = o.id AND p.is_archived)                                      AS archived_projects,
  (SELECT COALESCE(SUM(r.amount), 0) FROM revenue r
   WHERE r.organization_id = o.id AND EXTRACT(YEAR FROM r.date) = EXTRACT(YEAR FROM CURRENT_DATE))                       AS revenue_ytd,
  (SELECT COALESCE(SUM(e.amount), 0) FROM expense e
   WHERE e.organization_id = o.id AND EXTRACT(YEAR FROM e.date) = EXTRACT(YEAR FROM CURRENT_DATE))                       AS expenses_ytd,
  (SELECT COUNT(*) FROM lead l WHERE l.organization_id = o.id AND l.stage NOT IN ('won', 'lost'))                        AS open_leads,
  (SELECT COALESCE(SUM(i.amount), 0) FROM invoice i
   WHERE i.organization_id = o.id AND i.type = 'outgoing' AND i.status IN ('pending', 'overdue'))                        AS receivables,
  (SELECT COALESCE(SUM(i.amount), 0) FROM invoice i
   WHERE i.organization_id = o.id AND i.type = 'incoming' AND i.status IN ('pending', 'overdue'))                        AS payables
FROM "organization" o;

COMMIT;
