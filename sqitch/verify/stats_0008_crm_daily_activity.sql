-- Verify secondMind:stats_0008_crm_daily_activity on pg

BEGIN;

SELECT organization_id, day, interactions, new_contacts FROM v_crm_daily_activity WHERE false;

ROLLBACK;
