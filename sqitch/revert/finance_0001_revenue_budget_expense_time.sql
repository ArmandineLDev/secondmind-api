-- Revert secondMind:finance_0001_revenue_budget_expense_time from pg

BEGIN;

DROP TABLE IF EXISTS time_entry;
DROP TABLE IF EXISTS expense;
DROP TABLE IF EXISTS budget;
DROP TABLE IF EXISTS revenue;

COMMIT;
