-- Revert secondMind:finance_0005_drop_revenue from pg

BEGIN;

-- Recrée la table revenue à l'identique de finance_0001 (sans données).
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

CREATE INDEX idx_revenue_organization_id ON revenue (organization_id);
CREATE INDEX idx_revenue_date ON revenue (date);

COMMIT;
