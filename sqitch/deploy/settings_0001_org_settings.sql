-- Deploy secondMind:settings_0001_org_settings to pg

BEGIN;

CREATE TABLE organization_settings (
  organization_id  text         PRIMARY KEY REFERENCES "organization" (id) ON DELETE CASCADE,
  default_currency char(3)      NOT NULL DEFAULT 'EUR',
  default_daily_rate numeric(10,2),
  updated_at       timestamptz  NOT NULL DEFAULT now()
);

CREATE OR REPLACE TRIGGER set_organization_settings_updated_at
  BEFORE UPDATE ON organization_settings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMIT;
