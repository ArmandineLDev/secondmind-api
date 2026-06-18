-- Deploy secondMind:project_0002_kanban_and_tasks to pg

BEGIN;

CREATE TABLE kanban_column (
  id         uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid         NOT NULL REFERENCES project (id) ON DELETE CASCADE,
  name       varchar(100) NOT NULL,
  position   integer      NOT NULL,
  color      varchar(7)
);

CREATE TABLE task (
  id          uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  uuid         NOT NULL REFERENCES project (id) ON DELETE CASCADE,
  column_id   uuid         NOT NULL REFERENCES kanban_column (id) ON DELETE CASCADE,
  title       varchar(500) NOT NULL,
  description text,
  priority    varchar(10)  CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  position    integer      NOT NULL,
  due_date    date,
  created_at  timestamptz  NOT NULL DEFAULT now(),
  updated_at  timestamptz  NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_task_updated_at
  BEFORE UPDATE ON task
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE project_user (
  project_id uuid        NOT NULL REFERENCES project (id) ON DELETE CASCADE,
  user_id    text        NOT NULL REFERENCES "user" (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (project_id, user_id)
);

CREATE INDEX idx_kanban_column_project_id ON kanban_column (project_id);
CREATE INDEX idx_task_project_id ON task (project_id);
CREATE INDEX idx_task_column_id ON task (column_id);

COMMIT;
