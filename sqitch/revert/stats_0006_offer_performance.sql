-- Revert secondMind:stats_0006_offer_performance from pg

BEGIN;

DROP VIEW v_offer_performance;

COMMIT;
