-- Revert secondMind:finance_0002_invoice from pg

BEGIN;

DROP TABLE IF EXISTS invoice;

COMMIT;
