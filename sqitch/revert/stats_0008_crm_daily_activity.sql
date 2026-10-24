-- Revert secondMind:stats_0008_crm_daily_activity from pg

BEGIN;

DROP VIEW v_crm_daily_activity;

COMMIT;
