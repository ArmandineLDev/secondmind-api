-- Deploy secondMind:finance_0001_revenue_budget_expense_time to pg

BEGIN;

CREATE TABLE revenue (
  id              uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id text          NOT NULL REFERENCES "organization" (id) ON DELETE CASCADE,
  project_id      uuid          REFERENCES project (id) ON DELETE SET NULL,
  contact_id      uuid          REFERENCES contact (id) ON DELETE SET NULL,
  amount          numeric(12,2) NOT NULL,
  currency        char(3)       NOT NULL DEFAULT 'EUR',
  date            date          NOT NULL,
  description     text,
  created_at      timestamptz   NOT NULL DEFAULT now()
);

CREATE TABLE budget (
  id             uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id     uuid          NOT NULL UNIQUE REFERENCES project (id) ON DELETE CASCADE,
  planned_amount numeric(12,2) NOT NULL,
  currency       char(3)       NOT NULL DEFAULT 'EUR',
  created_at     timestamptz   NOT NULL DEFAULT now(),
  updated_at     timestamptz   NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_budget_updated_at
  BEFORE UPDATE ON budget
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE expense (
  id              uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id text          NOT NULL REFERENCES "organization" (id) ON DELETE CASCADE,
  project_id      uuid          REFERENCES project (id) ON DELETE SET NULL,
  category        varchar(50)   NOT NULL
                                CHECK (category IN ('subscription', 'equipment', 'training', 'travel', 'other')),
  description     text          NOT NULL,
  amount          numeric(12,2) NOT NULL,
  currency        char(3)       NOT NULL DEFAULT 'EUR',
  date            date          NOT NULL,
  created_at      timestamptz   NOT NULL DEFAULT now()
);

CREATE TABLE time_entry (
  id               uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  text          NOT NULL REFERENCES "organization" (id) ON DELETE CASCADE,
  project_id       uuid          REFERENCES project (id) ON DELETE SET NULL,
  task_id          uuid          REFERENCES task (id) ON DELETE SET NULL,
  duration_minutes integer       NOT NULL,
  hourly_rate      numeric(8,2),
  date             date          NOT NULL,
  description      text,
  created_at       timestamptz   NOT NULL DEFAULT now()
);

CREATE INDEX idx_revenue_organization_id ON revenue (organization_id);
CREATE INDEX idx_revenue_date ON revenue (date);
CREATE INDEX idx_expense_organization_id ON expense (organization_id);
CREATE INDEX idx_expense_date ON expense (date);
CREATE INDEX idx_time_entry_organization_id ON time_entry (organization_id);
CREATE INDEX idx_time_entry_project_id ON time_entry (project_id);
CREATE INDEX idx_time_entry_date ON time_entry (date);

COMMIT;
