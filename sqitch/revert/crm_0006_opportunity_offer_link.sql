-- Revert secondMind:crm_0006_opportunity_offer_link from pg

BEGIN;

ALTER TABLE opportunity DROP COLUMN offer_id;

COMMIT;
