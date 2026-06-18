-- Deploy secondMind:marketing_0001_offer_and_persona to pg

BEGIN;

CREATE TABLE offer (
  id              uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id text          NOT NULL REFERENCES "organization" (id) ON DELETE CASCADE,
  name            varchar(255)  NOT NULL,
  description     text,
  price           numeric(12,2),
  currency        char(3)       NOT NULL DEFAULT 'EUR',
  billing_type    varchar(20)   NOT NULL
                                CHECK (billing_type IN ('fixed', 'hourly', 'monthly', 'custom')),
  is_active       boolean       NOT NULL DEFAULT true,
  created_at      timestamptz   NOT NULL DEFAULT now(),
  updated_at      timestamptz   NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_offer_updated_at
  BEFORE UPDATE ON offer
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE persona (
  id                       uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id          text         NOT NULL REFERENCES "organization" (id) ON DELETE CASCADE,
  name                     varchar(255) NOT NULL,
  demo_first_name          varchar(100),
  demo_last_name           varchar(100),
  demo_age                 varchar(50),
  demo_marital_status      varchar(100),
  demo_job_title           varchar(150),
  demo_professional_status varchar(100),
  demo_income              varchar(100),
  interests                text,
  general_description      text,
  drivers                  text,
  vital_needs              text,
  purchase_motivations     text,
  purchase_barriers        text,
  offer_discovery          text,
  path_to_goal             text,
  created_at               timestamptz  NOT NULL DEFAULT now(),
  updated_at               timestamptz  NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_persona_updated_at
  BEFORE UPDATE ON persona
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_offer_organization_id ON offer (organization_id);
CREATE INDEX idx_persona_organization_id ON persona (organization_id);

COMMIT;
