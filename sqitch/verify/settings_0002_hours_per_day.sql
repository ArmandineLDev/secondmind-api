-- Verify secondMind:settings_0002_hours_per_day on pg

BEGIN;

SELECT organization_id, hours_per_day
  FROM organization_settings WHERE false;

ROLLBACK;
