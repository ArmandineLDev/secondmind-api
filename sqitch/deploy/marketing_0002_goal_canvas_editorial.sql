-- Deploy secondMind:marketing_0002_goal_canvas_editorial to pg

BEGIN;

CREATE TABLE goal (
  id              uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id text          NOT NULL REFERENCES "organization" (id) ON DELETE CASCADE,
  title           varchar(255)  NOT NULL,
  description     text,
  category        varchar(20)   NOT NULL
                                CHECK (category IN ('revenue', 'marketing', 'project', 'personal', 'other')),
  target_value    numeric(12,2),
  current_value   numeric(12,2),
  unit            varchar(50),
  due_date        date,
  status          varchar(20)   NOT NULL DEFAULT 'in_progress'
                                CHECK (status IN ('in_progress', 'achieved', 'missed')),
  created_at      timestamptz   NOT NULL DEFAULT now(),
  updated_at      timestamptz   NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_goal_updated_at
  BEFORE UPDATE ON goal
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE business_model_canvas (
  id                     uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id        text         NOT NULL REFERENCES "organization" (id) ON DELETE CASCADE,
  name                   varchar(255) NOT NULL,
  customer_segments      text,
  value_propositions     text,
  channels               text,
  customer_relationships text,
  revenue_streams        text,
  key_resources          text,
  key_activities         text,
  key_partners           text,
  cost_structure         text,
  created_at             timestamptz  NOT NULL DEFAULT now(),
  updated_at             timestamptz  NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_business_model_canvas_updated_at
  BEFORE UPDATE ON business_model_canvas
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE editorial_post (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id text        NOT NULL REFERENCES "organization" (id) ON DELETE CASCADE,
  persona_id      uuid        REFERENCES persona (id) ON DELETE SET NULL,
  network         varchar(20) NOT NULL
                              CHECK (network IN ('linkedin', 'instagram', 'facebook', 'twitter', 'tiktok', 'other')),
  title           varchar(255),
  content         text,
  status          varchar(20) NOT NULL DEFAULT 'idea'
                              CHECK (status IN ('idea', 'draft', 'scheduled', 'published')),
  scheduled_at    timestamptz,
  published_at    timestamptz,
  tags            text[],
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_editorial_post_updated_at
  BEFORE UPDATE ON editorial_post
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_goal_organization_id ON goal (organization_id);
CREATE INDEX idx_business_model_canvas_organization_id ON business_model_canvas (organization_id);
CREATE INDEX idx_editorial_post_organization_id ON editorial_post (organization_id);
CREATE INDEX idx_editorial_post_scheduled_at ON editorial_post (scheduled_at);

COMMIT;
