-- Deploy secondMind:kanban_0001_task_enhancements to pg

BEGIN;

-- Estimation et date de début sur les tâches
ALTER TABLE task
  ADD COLUMN start_date      date,
  ADD COLUMN estimated_hours numeric(6,2) CHECK (estimated_hours > 0);

-- Dépendances entre tâches (relation bloquante)
-- task_id ne peut pas démarrer tant que depends_on_id n'est pas terminé
CREATE TABLE task_dependency (
  task_id       uuid NOT NULL REFERENCES task (id) ON DELETE CASCADE,
  depends_on_id uuid NOT NULL REFERENCES task (id) ON DELETE CASCADE,
  PRIMARY KEY (task_id, depends_on_id),
  CHECK (task_id != depends_on_id)
);

CREATE INDEX idx_task_dependency_task_id       ON task_dependency (task_id);
CREATE INDEX idx_task_dependency_depends_on_id ON task_dependency (depends_on_id);

COMMIT;
