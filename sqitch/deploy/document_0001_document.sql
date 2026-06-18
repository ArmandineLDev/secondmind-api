-- Deploy secondMind:document_0001_document to pg

BEGIN;

-- client_id est text car user.id (Better Auth) est text
CREATE TABLE document (
  id              uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id text         NOT NULL REFERENCES "organization" (id) ON DELETE CASCADE,
  client_id       text         NOT NULL REFERENCES "user" (id) ON DELETE CASCADE,
  project_id      uuid         REFERENCES project (id) ON DELETE SET NULL,
  name            varchar(255) NOT NULL,
  type            varchar(20)  NOT NULL CHECK (type IN ('spec', 'contract', 'invoice', 'other')),
  file_key        text         NOT NULL UNIQUE,
  file_size       integer      NOT NULL,
  mime_type       varchar(100) NOT NULL,
  uploaded_at     timestamptz  NOT NULL DEFAULT now()
);

CREATE INDEX idx_document_organization_id ON document (organization_id);
CREATE INDEX idx_document_client_id ON document (client_id);

COMMIT;
