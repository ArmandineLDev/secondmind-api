-- Deploy secondMind:stats_0004_fix_estimated_cost to pg
-- requires: settings_0002_hours_per_day
-- requires: stats_0003_ca_from_invoices

BEGIN;

-- Corrige estimated_cost dans v_project_profitability :
--  1. l'ancienne sous-requête faisait un produit cartésien (LEFT JOIN time_entry sur
--     le projet sans lier à la tâche) → SUM(estimated_hours) gonflé ×(nb de saisies) ;
--  2. le taux venait de la moyenne des saisies (0 si aucune n'avait de taux).
-- Nouveau calcul : Σ(heures estimées) × (TJM ÷ heures facturables/jour), le taux
-- horaire étant dérivé des réglages du workspace (organization_settings).

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
  -- Coût estimé = somme des heures estimées × taux horaire dérivé du TJM du workspace.
  (SELECT COALESCE(SUM(t.estimated_hours), 0) FROM task t WHERE t.project_id = p.id)
    * COALESCE(
        (SELECT os.default_daily_rate / NULLIF(os.hours_per_day, 0)
         FROM organization_settings os WHERE os.organization_id = p.organization_id),
        0
      )                                                                                             AS estimated_cost
FROM project p
LEFT JOIN budget b ON b.project_id = p.id;

COMMIT;
