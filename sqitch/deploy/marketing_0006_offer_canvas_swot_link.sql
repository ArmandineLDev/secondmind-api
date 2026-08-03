-- Deploy secondMind:marketing_0006_offer_canvas_swot_link to pg
-- requires: marketing_0005_value_proposition_canvas

BEGIN;

ALTER TABLE offer
  ADD COLUMN canvas_id uuid REFERENCES business_model_canvas (id) ON DELETE SET NULL,
  ADD COLUMN swot_id   uuid REFERENCES swot_analysis (id) ON DELETE SET NULL;

CREATE INDEX idx_offer_canvas_id ON offer (canvas_id);
CREATE INDEX idx_offer_swot_id ON offer (swot_id);

COMMIT;
