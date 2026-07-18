-- Revert secondMind:finance_0003_invoice_company from pg

BEGIN;

DROP INDEX IF EXISTS idx_invoice_company_id;

ALTER TABLE invoice
  DROP COLUMN IF EXISTS company_id;

COMMIT;
