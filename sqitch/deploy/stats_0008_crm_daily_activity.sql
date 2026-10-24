-- Deploy secondMind:stats_0008_crm_daily_activity to pg
-- requires: crm_0002_lead_and_interaction

BEGIN;

-- Activité commerciale par jour, lue par « Ma semaine » (en-tête de chaque jour
-- et bilan de la semaine) au lieu d'une saisie manuelle (décidé le 2026-10-24).
-- Grain : une ligne par organisation et par jour où au moins une interaction
-- a eu lieu.
--
-- Deux chiffres, côte à côte :
--   - interactions : tous les échanges du jour (relances comprises) ;
--   - new_contacts : les personnes contactées pour la PREMIÈRE fois ce jour-là,
--     c'est-à-dire dont la toute première interaction tombe ce jour. C'est la
--     mesure de l'engagement « 10 contacts à froid par jour ouvré ».
-- Un contact créé dans le CRM sans aucune interaction ne compte pas : c'est
-- l'échange qui fait le contact, pas la fiche.
CREATE VIEW v_crm_daily_activity AS
WITH first_touch AS (
  SELECT contact_id, MIN(date) AS first_date
  FROM interaction
  GROUP BY contact_id
)
SELECT
  c.organization_id,
  i.date                                                               AS day,
  COUNT(*)                                                             AS interactions,
  COUNT(DISTINCT i.contact_id) FILTER (WHERE ft.first_date = i.date)   AS new_contacts
FROM interaction i
JOIN contact c      ON c.id = i.contact_id
JOIN first_touch ft ON ft.contact_id = i.contact_id
GROUP BY c.organization_id, i.date;

COMMIT;
