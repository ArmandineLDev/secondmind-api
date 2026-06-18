-- Deploy secondMind:crm_0001_company_and_contact to pg

BEGIN;

-- company avant contact : contact a une FK optionnelle vers company
CREATE TABLE company (
  id              uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id text         NOT NULL REFERENCES "organization" (id) ON DELETE CASCADE,
  name            varchar(255) NOT NULL,
  website         varchar(255),
  industry        varchar(100),
  notes           text,
  created_at      timestamptz  NOT NULL DEFAULT now(),
  updated_at      timestamptz  NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_company_updated_at
  BEFORE UPDATE ON company
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE contact (
  id              uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id text         NOT NULL REFERENCES "organization" (id) ON DELETE CASCADE,
  company_id      uuid         REFERENCES company (id) ON DELETE SET NULL,
  first_name      varchar(100) NOT NULL,
  last_name       varchar(100) NOT NULL,
  email           varchar(255),
  phone           varchar(30),
  status          varchar(20)  NOT NULL DEFAULT 'lead'
                               CHECK (status IN ('lead', 'prospect', 'client', 'former_client', 'partner', 'other')),
  notes           text,
  created_at      timestamptz  NOT NULL DEFAULT now(),
  updated_at      timestamptz  NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_contact_updated_at
  BEFORE UPDATE ON contact
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_company_organization_id ON company (organization_id);
CREATE INDEX idx_contact_organization_id ON contact (organization_id);

COMMIT;
