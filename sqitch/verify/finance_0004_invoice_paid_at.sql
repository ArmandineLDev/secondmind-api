-- Verify secondMind:finance_0004_invoice_paid_at on pg

BEGIN;

SELECT id, paid_at
  FROM invoice WHERE false;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE tablename = 'invoice' AND indexname = 'idx_invoice_paid_at'
  ) THEN
    RAISE EXCEPTION 'Index manquant : idx_invoice_paid_at';
  END IF;
END $$;

ROLLBACK;
