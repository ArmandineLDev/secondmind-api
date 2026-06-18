-- Verify secondMind:settings_0001_org_settings on pg

BEGIN;

SELECT organization_id, default_currency, default_daily_rate, updated_at
  FROM organization_settings WHERE false;

ROLLBACK;
