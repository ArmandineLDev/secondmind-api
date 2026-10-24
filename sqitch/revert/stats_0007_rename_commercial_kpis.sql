-- Revert secondMind:stats_0007_rename_commercial_kpis from pg

BEGIN;

ALTER VIEW v_commercial_kpis RENAME TO v_marketing_kpis;

COMMIT;
