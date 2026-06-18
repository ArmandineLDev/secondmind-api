-- Deploy secondMind:finance_0002_invoice to pg

BEGIN;

CREATE TABLE invoice (
  id              uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id text          NOT NULL REFERENCES "organization" (id) ON DELETE CASCADE,
  type            varchar(10)   NOT NULL CHECK (type IN ('outgoing', 'incoming')),
  contact_id      uuid          REFERENCES contact (id) ON DELETE SET NULL,
  project_id      uuid          REFERENCES project (id) ON DELETE SET NULL,
  reference       varchar(100),
  amount          numeric(12,2) NOT NULL,
  currency        char(3)       NOT NULL DEFAULT 'EUR',
  issue_date      date          NOT NULL,
  due_date        date,
  status          varchar(20)   NOT NULL DEFAULT 'pending'
                                CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
  notes           text,
  created_at      timestamptz   NOT NULL DEFAULT now(),
  updated_at      timestamptz   NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_invoice_updated_at
  BEFORE UPDATE ON invoice
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_invoice_organization_id ON invoice (organization_id);
CREATE INDEX idx_invoice_status ON invoice (status);
CREATE INDEX idx_invoice_due_date ON invoice (due_date);

COMMIT;
