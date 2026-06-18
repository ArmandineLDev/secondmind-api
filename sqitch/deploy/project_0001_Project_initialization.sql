-- Deploy secondMind:project_0001_Project_initialization to pg

BEGIN;

CREATE TYPE project_status AS ENUM (
  'not_started',
  'in_progress',
  'on_hold',
  'completed',
  'cancelled'
);

-- Trigger function réutilisée dans toutes les tables avec updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE project (
  id              uuid           PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id text           NOT NULL REFERENCES "organization" (id) ON DELETE CASCADE,
  name            varchar(100)   NOT NULL,
  description     text,
  status          project_status NOT NULL DEFAULT 'not_started',
  is_archived     boolean        NOT NULL DEFAULT false,
  is_default      boolean        NOT NULL DEFAULT false,
  archived_at     timestamptz,
  created_at      timestamptz    NOT NULL DEFAULT now(),
  updated_at      timestamptz    NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_project_updated_at
  BEFORE UPDATE ON project
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_project_organization_id ON project (organization_id);

COMMIT;
