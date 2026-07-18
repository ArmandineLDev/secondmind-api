-- Deploy secondMind:stats_0003_ca_from_invoices to pg
-- requires: finance_0004_invoice_paid_at
-- requires: stats_0002_update_views

BEGIN;

-- Le CA n'est plus lu dans la table `revenue` (supprimée en finance_0005) mais
-- dérivé des factures ÉMISES PAYÉES (type='outgoing', status='paid'), rattachées à
-- leur date d'encaissement COALESCE(paid_at, issue_date) — compta de trésorerie.

DROP VIEW IF EXISTS v_project_profitability;
DROP VIEW IF EXISTS v_project_summary;
DROP VIEW IF EXISTS v_monthly_revenue;
DROP VIEW IF EXISTS v_kpis;
DROP VIEW IF EXISTS v_cumulative_pnl;

-- Résumé par projet : total_revenue = factures émises payées du projet
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
  (SELECT COUNT(*)                            FROM task t  WHERE t.project_id = p.id)               AS task_count,
  (SELECT COALESCE(SUM(t.estimated_hours), 0) FROM task t  WHERE t.project_id = p.id)               AS estimated_hours,
  (SELECT COALESCE(SUM(te.duration_minutes), 0) FROM time_entry te WHERE te.project_id = p.id)       AS total_minutes,
  b.planned_amount                                                                                    AS budget_amount,
  b.currency                                                                                          AS budget_currency,
  (SELECT COALESCE(SUM(i.amount), 0) FROM invoice i
   WHERE i.project_id = p.id AND i.type = 'outgoing' AND i.status = 'paid')                          AS total_revenue
FROM project p
LEFT JOIN budget b ON b.project_id = p.id;

-- Rentabilité : total_revenue = factures payées ; estimated_cost inchangé (bug connu,
-- fix = stats_0004 en attente de la décision TJM — on ne modifie pas le comportement ici)
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

-- CA mensuel : factures émises payées, groupées au mois de l'encaissement
CREATE VIEW v_monthly_revenue AS
SELECT
  organization_id,
  DATE_TRUNC('month', COALESCE(paid_at, issue_date)) AS month,
  currency,
  SUM(amount)                                        AS total
FROM invoice
WHERE type = 'outgoing' AND status = 'paid'
GROUP BY organization_id, DATE_TRUNC('month', COALESCE(paid_at, issue_date)), currency;

-- KPIs globaux : revenue_ytd = factures émises payées de l'année en cours
CREATE VIEW v_kpis AS
SELECT
  o.id                                                                                                                    AS organization_id,
  (SELECT COUNT(*) FROM project p WHERE p.organization_id = o.id AND NOT p.is_archived)                                  AS active_projects,
  (SELECT COUNT(*) FROM project p WHERE p.organization_id = o.id AND p.is_archived)                                      AS archived_projects,
  (SELECT COALESCE(SUM(i.amount), 0) FROM invoice i
   WHERE i.organization_id = o.id AND i.type = 'outgoing' AND i.status = 'paid'
     AND EXTRACT(YEAR FROM COALESCE(i.paid_at, i.issue_date)) = EXTRACT(YEAR FROM CURRENT_DATE))                         AS revenue_ytd,
  (SELECT COALESCE(SUM(e.amount), 0) FROM expense e
   WHERE e.organization_id = o.id AND EXTRACT(YEAR FROM e.date) = EXTRACT(YEAR FROM CURRENT_DATE))                       AS expenses_ytd,
  (SELECT COUNT(*) FROM lead l WHERE l.organization_id = o.id AND l.stage NOT IN ('won', 'lost'))                        AS open_leads,
  (SELECT COALESCE(SUM(i.amount), 0) FROM invoice i
   WHERE i.organization_id = o.id AND i.type = 'outgoing' AND i.status IN ('pending', 'overdue'))                        AS receivables,
  (SELECT COALESCE(SUM(i.amount), 0) FROM invoice i
   WHERE i.organization_id = o.id AND i.type = 'incoming' AND i.status IN ('pending', 'overdue'))                        AS payables
FROM "organization" o;

-- Résultat net cumulé par année : CA encaissé (factures payées) − dépenses payées,
-- avec cumul glissant. Le 1er `year` où `cumulative_net >= 0` = sortie de déficit.
CREATE VIEW v_cumulative_pnl AS
WITH years AS (
  SELECT organization_id, yr FROM (
    SELECT organization_id, EXTRACT(YEAR FROM COALESCE(paid_at, issue_date))::int AS yr
    FROM invoice WHERE type = 'outgoing' AND status = 'paid'
    UNION
    SELECT organization_id, EXTRACT(YEAR FROM date)::int AS yr
    FROM expense
  ) s
  GROUP BY organization_id, yr
),
rev AS (
  SELECT organization_id,
         EXTRACT(YEAR FROM COALESCE(paid_at, issue_date))::int AS yr,
         SUM(amount) AS revenue
  FROM invoice WHERE type = 'outgoing' AND status = 'paid'
  GROUP BY organization_id, EXTRACT(YEAR FROM COALESCE(paid_at, issue_date))::int
),
exp AS (
  SELECT organization_id,
         EXTRACT(YEAR FROM date)::int AS yr,
         SUM(amount) AS expenses
  FROM expense
  GROUP BY organization_id, EXTRACT(YEAR FROM date)::int
)
SELECT
  y.organization_id,
  y.yr                                                        AS year,
  COALESCE(r.revenue, 0)                                      AS revenue,
  COALESCE(e.expenses, 0)                                     AS expenses,
  COALESCE(r.revenue, 0) - COALESCE(e.expenses, 0)           AS net,
  SUM(COALESCE(r.revenue, 0) - COALESCE(e.expenses, 0))
    OVER (PARTITION BY y.organization_id ORDER BY y.yr)       AS cumulative_net
FROM years y
LEFT JOIN rev r ON r.organization_id = y.organization_id AND r.yr = y.yr
LEFT JOIN exp e ON e.organization_id = y.organization_id AND e.yr = y.yr;

COMMIT;
