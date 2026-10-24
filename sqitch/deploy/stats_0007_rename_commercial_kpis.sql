-- Deploy secondMind:stats_0007_rename_commercial_kpis to pg
-- requires: stats_0005_rename_lead_views

BEGIN;

-- Le module « Marketing » est devenu « Stratégie » (2026-10-24), et ses
-- indicateurs d'opportunités s'affichent sous « Commercial » : contactées,
-- gagnées, taux de réponse et de conversion. Rien de marketing là-dedans, tout
-- vient du CRM. La vue prend le nom de ce qu'elle mesure.
--
-- RENAME plutôt que DROP + CREATE : la définition ne change pas, et les droits
-- accordés au rôle applicatif suivent la vue.
ALTER VIEW v_marketing_kpis RENAME TO v_commercial_kpis;

COMMIT;
