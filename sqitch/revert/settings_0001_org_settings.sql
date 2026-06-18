-- Revert secondMind:settings_0001_org_settings from pg

BEGIN;

DROP TABLE IF EXISTS organization_settings;

COMMIT;
