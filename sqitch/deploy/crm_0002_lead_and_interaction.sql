-- Deploy secondMind:crm_0002_lead_and_interaction to pg

BEGIN;

CREATE TABLE lead (
  id              uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id text          NOT NULL REFERENCES "organization" (id) ON DELETE CASCADE,
  contact_id      uuid          REFERENCES contact (id) ON DELETE SET NULL,
  company_id      uuid          REFERENCES company (id) ON DELETE SET NULL,
  title           varchar(255)  NOT NULL,
  value           numeric(12,2),
  stage           varchar(30)   NOT NULL DEFAULT 'prospect'
                                CHECK (stage IN ('prospect', 'qualification', 'proposal', 'negotiation', 'won', 'lost')),
  probability     integer       CHECK (probability IS NULL OR (probability >= 0 AND probability <= 100)),
  notes           text,
  closed_at       date,
  created_at      timestamptz   NOT NULL DEFAULT now(),
  updated_at      timestamptz   NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_lead_updated_at
  BEFORE UPDATE ON lead
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE interaction (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid        NOT NULL REFERENCES contact (id) ON DELETE CASCADE,
  lead_id    uuid        REFERENCES lead (id) ON DELETE SET NULL,
  type       varchar(20) NOT NULL CHECK (type IN ('email', 'call', 'meeting', 'other')),
  date       date        NOT NULL,
  notes      text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_lead_organization_id ON lead (organization_id);
CREATE INDEX idx_lead_stage ON lead (stage);
CREATE INDEX idx_interaction_contact_id ON interaction (contact_id);
CREATE INDEX idx_interaction_lead_id ON interaction (lead_id);

COMMIT;
