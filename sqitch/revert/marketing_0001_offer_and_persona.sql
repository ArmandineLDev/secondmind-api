-- Revert secondMind:marketing_0001_offer_and_persona from pg

BEGIN;

DROP TABLE IF EXISTS persona;
DROP TABLE IF EXISTS offer;

COMMIT;
