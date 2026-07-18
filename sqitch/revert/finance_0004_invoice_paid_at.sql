-- Revert secondMind:finance_0004_invoice_paid_at from pg

BEGIN;

DROP INDEX IF EXISTS idx_invoice_paid_at;

ALTER TABLE invoice
  DROP COLUMN IF EXISTS paid_at;

COMMIT;
