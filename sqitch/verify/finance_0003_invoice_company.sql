-- Verify secondMind:finance_0003_invoice_company on pg

BEGIN;

SELECT id, company_id
  FROM invoice WHERE false;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE tablename = 'invoice'
      AND indexname = 'idx_invoice_company_id'
  ) THEN
    RAISE EXCEPTION 'Index manquant : idx_invoice_company_id';
  END IF;
END $$;

ROLLBACK;
