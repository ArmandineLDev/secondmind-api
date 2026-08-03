-- Revert secondMind:marketing_0004_swot_analysis from pg

BEGIN;

DROP TABLE swot_analysis;

COMMIT;
