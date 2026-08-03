-- Revert secondMind:marketing_0006_offer_canvas_swot_link from pg

BEGIN;

ALTER TABLE offer
  DROP COLUMN canvas_id,
  DROP COLUMN swot_id;

COMMIT;
