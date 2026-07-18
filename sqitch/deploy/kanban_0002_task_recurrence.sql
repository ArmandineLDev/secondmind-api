-- Deploy secondMind:kanban_0002_task_recurrence to pg
-- requires: kanban_0001_task_enhancements

BEGIN;

-- Récurrence « tâche qui se reprogramme » : recurrence_freq != null rend la tâche
-- récurrente. La due_date sert de prochaine occurrence ; l'action « Fait — replanifier »
-- l'avance selon la règle. Un renouvellement de contrat = une tâche 'yearly'.
ALTER TABLE task
  ADD COLUMN recurrence_freq     varchar(10)
    CHECK (recurrence_freq IN ('weekly', 'monthly', 'yearly')),
  ADD COLUMN recurrence_interval smallint    NOT NULL DEFAULT 1
    CHECK (recurrence_interval > 0),
  ADD COLUMN recurrence_days     smallint[],
  ADD COLUMN recurrence_until    date;

COMMIT;
