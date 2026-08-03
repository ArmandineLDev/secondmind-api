-- Verify secondMind:marketing_0006_offer_canvas_swot_link on pg

BEGIN;

SELECT canvas_id, swot_id FROM offer WHERE false;

ROLLBACK;
