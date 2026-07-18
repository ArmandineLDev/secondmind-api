-- Revert secondMind:settings_0002_hours_per_day from pg

BEGIN;

ALTER TABLE organization_settings
  DROP COLUMN IF EXISTS hours_per_day;

COMMIT;
