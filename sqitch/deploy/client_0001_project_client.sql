-- Deploy secondMind:client_0001_project_client to pg

BEGIN;

-- Table pivot pour l'affectation des projets aux clients
CREATE TABLE project_client (
  project_id  uuid NOT NULL REFERENCES project (id) ON DELETE CASCADE,
  client_id   text NOT NULL REFERENCES "user" (id) ON DELETE CASCADE,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (project_id, client_id)
);

CREATE INDEX idx_project_client_project_id ON project_client (project_id);
CREATE INDEX idx_project_client_client_id  ON project_client (client_id);

COMMIT;
