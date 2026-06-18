-- Revert secondMind:crm_0001_company_and_contact from pg

BEGIN;

DROP TABLE IF EXISTS contact;
DROP TABLE IF EXISTS company;

COMMIT;
