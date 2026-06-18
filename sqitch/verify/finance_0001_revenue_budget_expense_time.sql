-- Verify secondMind:finance_0001_revenue_budget_expense_time on pg

BEGIN;

-- Colonnes
SELECT id, organization_id, project_id, contact_id, amount, currency, date, description, created_at
  FROM revenue WHERE false;

SELECT id, project_id, planned_amount, currency, created_at, updated_at
  FROM budget WHERE false;

SELECT id, organization_id, project_id, category, description, amount, currency, date, created_at
  FROM expense WHERE false;

SELECT id, organization_id, project_id, task_id, duration_minutes, hourly_rate, date, description, created_at
  FROM time_entry WHERE false;

-- Contrainte UNIQUE budget.project_id (1 budget max par projet)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'budget'::regclass AND contype = 'u'
  ) THEN
    RAISE EXCEPTION 'Contrainte UNIQUE manquante sur budget.project_id';
  END IF;
END $$;

-- Contrainte CHECK expense.category
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'expense'::regclass AND contype = 'c' AND conname LIKE '%category%'
  ) THEN
    RAISE EXCEPTION 'Contrainte CHECK manquante sur expense.category';
  END IF;
END $$;

-- Triggers
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_budget_updated_at'
  ) THEN
    RAISE EXCEPTION 'Trigger manquant : trg_budget_updated_at';
  END IF;
END $$;

-- Index
DO $$
DECLARE missing text;
BEGIN
  SELECT string_agg(i, ', ') INTO missing
  FROM unnest(ARRAY[
    'idx_revenue_organization_id',
    'idx_revenue_date',
    'idx_expense_organization_id',
    'idx_expense_date',
    'idx_time_entry_organization_id',
    'idx_time_entry_project_id',
    'idx_time_entry_date'
  ]) AS i
  WHERE NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = i
  );
  IF missing IS NOT NULL THEN
    RAISE EXCEPTION 'Index(es) manquant(s) : %', missing;
  END IF;
END $$;

ROLLBACK;
