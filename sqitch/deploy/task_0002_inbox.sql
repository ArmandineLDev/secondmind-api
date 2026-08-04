-- Deploy secondMind:task_0002_inbox to pg
-- requires: project_0002_kanban_and_tasks
-- requires: kanban_0002_task_recurrence

BEGIN;

-- Capture rapide « second cerveau » (cf. functional-spec §3.9).
-- On étend `task` plutôt que d'introduire une table `idea` : une idée capturée
-- EST une tâche, simplement à un stade antérieur de son cycle de vie.
--
-- Pas de valeur `done` : l'achèvement reste porté par la colonne kanban
-- « Terminé ». Une seule source de vérité pour « la tâche est faite », sinon on
-- obtient des tâches `done` rangées dans « En cours ».
CREATE TYPE task_stage AS ENUM ('inbox', 'backlog', 'active', 'cancelled');

ALTER TABLE task
  ADD COLUMN stage        task_stage NOT NULL DEFAULT 'inbox',
  ADD COLUMN snooze_until date;

-- Toutes les tâches existantes sont posées sur un board : elles sont donc actives.
-- (Le défaut 'inbox' ne vaut que pour les futures captures.)
UPDATE task SET stage = 'active';

-- ⚠️ Cloisonnement multi-tenant. Jusqu'ici, l'organisation d'une tâche était
-- déduite de son projet (`JOIN project ON ... WHERE p.organization_id = $1`).
-- Une tâche d'inbox n'ayant PAS de projet, elle n'appartiendrait à aucun
-- workspace et resterait invisible. La colonne devient donc portée directement
-- par la tâche, comme sur toutes les autres tables métier.
ALTER TABLE task
  ADD COLUMN organization_id text REFERENCES "organization" (id) ON DELETE CASCADE;

UPDATE task t
SET organization_id = p.organization_id
FROM project p
WHERE p.id = t.project_id;

ALTER TABLE task
  ALTER COLUMN organization_id SET NOT NULL;

CREATE INDEX idx_task_organization_id ON task (organization_id);

-- Une tâche peut désormais exister hors de tout board.
ALTER TABLE task
  ALTER COLUMN project_id DROP NOT NULL,
  ALTER COLUMN column_id  DROP NOT NULL;

-- `position` n'a de sens que dans une colonne ; elle reste NOT NULL pour ne pas
-- compliquer les tris existants, mais prend un défaut afin qu'une capture n'ait
-- pas à l'inventer.
ALTER TABLE task
  ALTER COLUMN position SET DEFAULT 0;

-- Invariant central : une tâche sur un board a forcément un projet ET une colonne.
-- Les autres stades peuvent s'en passer.
ALTER TABLE task
  ADD CONSTRAINT task_active_requires_board
  CHECK (stage <> 'active' OR (project_id IS NOT NULL AND column_id IS NOT NULL));

CREATE INDEX idx_task_stage ON task (stage);
-- Le tri de l'inbox masque les tâches différées : index partiel sur les seules
-- lignes concernées, plutôt que sur toute la table.
CREATE INDEX idx_task_snooze_until ON task (snooze_until) WHERE snooze_until IS NOT NULL;

COMMIT;
