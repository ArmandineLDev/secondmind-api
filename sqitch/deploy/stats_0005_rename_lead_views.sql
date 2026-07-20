-- Deploy secondMind:stats_0005_rename_lead_views to pg
-- requires: stats_0004_fix_estimated_cost
-- requires: crm_0003_rename_lead_to_opportunity

BEGIN;

DROP VIEW IF EXISTS v_marketing_kpis;
DROP VIEW IF EXISTS v_lead_pipeline;
DROP VIEW IF EXISTS v_kpis;

-- KPIs globaux : open_leads -> open_opportunities (table lead renommée en opportunity)
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
  (SELECT COUNT(*) FROM opportunity op WHERE op.organization_id = o.id AND op.stage NOT IN ('won', 'lost'))              AS open_opportunities,
  (SELECT COALESCE(SUM(i.amount), 0) FROM invoice i
   WHERE i.organization_id = o.id AND i.type = 'outgoing' AND i.status IN ('pending', 'overdue'))                        AS receivables,
  (SELECT COALESCE(SUM(i.amount), 0) FROM invoice i
   WHERE i.organization_id = o.id AND i.type = 'incoming' AND i.status IN ('pending', 'overdue'))                        AS payables
FROM "organization" o;

-- Pipeline commercial : opportunités groupées par stade avec montants agrégés
CREATE VIEW v_opportunity_pipeline AS
SELECT
  organization_id,
  stage,
  COUNT(*)                         AS opportunity_count,
  COALESCE(SUM(value), 0)          AS total_value,
  COALESCE(AVG(probability), 0)    AS avg_probability
FROM opportunity
GROUP BY organization_id, stage;

-- KPIs marketing : opportunités contactées, taux de réponse, conversion
CREATE VIEW v_marketing_kpis AS
SELECT
  op.organization_id,
  COUNT(*)                                                                                                 AS total_opportunities,
  COUNT(*) FILTER (WHERE EXISTS (
    SELECT 1 FROM interaction i WHERE i.opportunity_id = op.id
  ))                                                                                                       AS opportunities_with_interaction,
  COUNT(*) FILTER (WHERE op.stage = 'won')                                                                 AS won_opportunities,
  COALESCE(SUM(op.value) FILTER (WHERE op.stage = 'won'), 0)                                               AS won_value
FROM opportunity op
GROUP BY op.organization_id;

COMMIT;
