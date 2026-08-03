-- Deploy secondMind:marketing_0004_swot_analysis to pg
-- requires: marketing_0003_canvas_lean_fields

BEGIN;

CREATE TABLE swot_analysis (
  id              uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id text         NOT NULL REFERENCES "organization" (id) ON DELETE CASCADE,
  name            varchar(255) NOT NULL,
  strengths       text,
  weaknesses      text,
  opportunities   text,
  threats         text,
  created_at      timestamptz  NOT NULL DEFAULT now(),
  updated_at      timestamptz  NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_swot_analysis_updated_at
  BEFORE UPDATE ON swot_analysis
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_swot_analysis_organization_id ON swot_analysis (organization_id);

COMMIT;
