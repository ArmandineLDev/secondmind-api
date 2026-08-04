-- Deploy secondMind:stats_0006_offer_performance to pg
-- requires: crm_0006_opportunity_offer_link
-- requires: stats_0005_rename_lead_views

BEGIN;

-- Performance commerciale par offre du catalogue.
-- Grain : une ligne par offre (v_marketing_kpis, elle, a une ligne par organisation).
--
-- Le taux de conversion ne porte que sur les affaires TRANCHÉES (won + lost) :
-- une opportunité encore ouverte n'est pas un échec, l'inclure au dénominateur
-- écraserait artificiellement le taux des offres au cycle de vente long.
CREATE VIEW v_offer_performance AS
SELECT
  o.organization_id,
  o.id                                                            AS offer_id,
  o.name                                                          AS offer_name,
  o.is_active,
  COUNT(op.id)                                                    AS total_opportunities,
  COUNT(op.id) FILTER (WHERE op.stage = 'won')                    AS won_opportunities,
  COUNT(op.id) FILTER (WHERE op.stage = 'lost')                   AS lost_opportunities,
  COUNT(op.id) FILTER (WHERE op.stage NOT IN ('won', 'lost'))     AS open_opportunities,
  ROUND(
    COUNT(op.id) FILTER (WHERE op.stage = 'won')::numeric
    / NULLIF(COUNT(op.id) FILTER (WHERE op.stage IN ('won', 'lost')), 0)
    * 100
  , 1)                                                            AS conversion_rate,
  COALESCE(SUM(op.value) FILTER (WHERE op.stage = 'won'), 0)      AS won_value,
  COALESCE(
    SUM(op.value * op.probability / 100)
      FILTER (WHERE op.stage NOT IN ('won', 'lost')), 0
  )::numeric(12,2)                                                AS weighted_pipeline
FROM offer o
LEFT JOIN opportunity op ON op.offer_id = o.id
GROUP BY o.organization_id, o.id, o.name, o.is_active

UNION ALL

-- Ligne agrégée du sur-mesure : opportunités rattachées à aucune offre du
-- catalogue. offer_id/offer_name à NULL — c'est au front de poser le libellé
-- (base en anglais, interface en français).
SELECT
  op.organization_id,
  NULL::uuid                                                      AS offer_id,
  NULL::varchar(255)                                              AS offer_name,
  NULL::boolean                                                   AS is_active,
  COUNT(*)                                                        AS total_opportunities,
  COUNT(*) FILTER (WHERE op.stage = 'won')                        AS won_opportunities,
  COUNT(*) FILTER (WHERE op.stage = 'lost')                       AS lost_opportunities,
  COUNT(*) FILTER (WHERE op.stage NOT IN ('won', 'lost'))         AS open_opportunities,
  ROUND(
    COUNT(*) FILTER (WHERE op.stage = 'won')::numeric
    / NULLIF(COUNT(*) FILTER (WHERE op.stage IN ('won', 'lost')), 0)
    * 100
  , 1)                                                            AS conversion_rate,
  COALESCE(SUM(op.value) FILTER (WHERE op.stage = 'won'), 0)      AS won_value,
  COALESCE(
    SUM(op.value * op.probability / 100)
      FILTER (WHERE op.stage NOT IN ('won', 'lost')), 0
  )::numeric(12,2)                                                AS weighted_pipeline
FROM opportunity op
WHERE op.offer_id IS NULL
GROUP BY op.organization_id;

COMMIT;
