-- Deploy secondMind:marketing_0005_value_proposition_canvas to pg
-- requires: marketing_0004_swot_analysis
-- requires: marketing_0001_offer_and_persona

BEGIN;

CREATE TABLE value_proposition_canvas (
  id                uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   text         NOT NULL REFERENCES "organization" (id) ON DELETE CASCADE,
  offer_id          uuid         REFERENCES offer (id) ON DELETE SET NULL,
  persona_id        uuid         REFERENCES persona (id) ON DELETE SET NULL,
  name              varchar(255) NOT NULL,
  customer_jobs     text,
  customer_pains    text,
  customer_gains    text,
  products_services text,
  pain_relievers    text,
  gain_creators     text,
  created_at        timestamptz  NOT NULL DEFAULT now(),
  updated_at        timestamptz  NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_value_proposition_canvas_updated_at
  BEFORE UPDATE ON value_proposition_canvas
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_value_proposition_canvas_organization_id ON value_proposition_canvas (organization_id);
CREATE INDEX idx_value_proposition_canvas_offer_id ON value_proposition_canvas (offer_id);
CREATE INDEX idx_value_proposition_canvas_persona_id ON value_proposition_canvas (persona_id);

COMMIT;
