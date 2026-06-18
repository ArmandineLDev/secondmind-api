-- Revert secondMind:crm_0002_lead_and_interaction from pg

BEGIN;

DROP TABLE IF EXISTS interaction;
DROP TABLE IF EXISTS lead;

COMMIT;
