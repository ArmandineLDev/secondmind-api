-- Deploy secondMind:stats_0001_views to pg

BEGIN;

-- Résumé par projet : nb de tâches, budget, CA total, temps total
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

-- Pipeline commercial : leads groupés par stade avec montants agrégés
CREATE VIEW v_lead_pipeline AS
SELECT
  organization_id,
  stage,
  COUNT(*)                         AS lead_count,
  COALESCE(SUM(value), 0)          AS total_value,
  COALESCE(AVG(probability), 0)    AS avg_probability
FROM lead
GROUP BY organization_id, stage;

-- CA mensuel agrégé (pour les graphiques d'évolution)
CREATE VIEW v_monthly_revenue AS
SELECT
  organization_id,
  DATE_TRUNC('month', date) AS month,
  currency,
  SUM(amount)               AS total
FROM revenue
GROUP BY organization_id, DATE_TRUNC('month', date), currency;

-- Rentabilité par projet : budget vs CA vs coût du temps tracké
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

-- Synthèse des factures en attente et en retard, par type (outgoing/incoming)
-- Le statut overdue est calculé dynamiquement : pending + due_date dépassée
CREATE VIEW v_invoice_summary AS
SELECT
  organization_id,
  type,
  SUM(CASE
    WHEN status = 'pending' AND (due_date IS NULL OR due_date >= CURRENT_DATE)
    THEN amount ELSE 0
  END)                                                                        AS pending_amount,
  SUM(CASE
    WHEN status = 'overdue'
      OR (status = 'pending' AND due_date IS NOT NULL AND due_date < CURRENT_DATE)
    THEN amount ELSE 0
  END)                                                                        AS overdue_amount,
  COUNT(*) FILTER (WHERE
    status IN ('pending', 'overdue')
    OR (status = 'pending' AND due_date IS NOT NULL AND due_date < CURRENT_DATE)
  )                                                                           AS open_count
FROM invoice
GROUP BY organization_id, type;

-- KPIs globaux du workspace (CA ytd, dépenses ytd, projets, leads, créances/passif)
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

-- KPIs marketing : leads contactés, taux de réponse, conversion
CREATE VIEW v_marketing_kpis AS
SELECT
  l.organization_id,
  COUNT(*)                                                                                                 AS total_leads,
  COUNT(*) FILTER (WHERE EXISTS (
    SELECT 1 FROM interaction i WHERE i.lead_id = l.id
  ))                                                                                                       AS leads_with_interaction,
  COUNT(*) FILTER (WHERE l.stage = 'won')                                                                 AS won_leads,
  COALESCE(SUM(l.value) FILTER (WHERE l.stage = 'won'), 0)                                               AS won_value
FROM lead l
GROUP BY l.organization_id;

COMMIT;
