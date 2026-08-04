import { db } from '@/lib/db'
import type { Task } from '@/features/tasks/task.types'
import type { CreateTaskInput, UpdateTaskInput, MoveTaskInput } from '@/features/tasks/task.schema'

export async function findAllTasks(
  organizationId: string,
  filters: { project_id?: string; priority?: string; column_id?: string; stage?: string }
): Promise<Task[]> {
  // Le cloisonnement passe désormais par `t.organization_id` et non plus par une
  // jointure sur le projet : une tâche d'inbox n'en a pas (cf. task_0002_inbox).
  const conditions: string[] = ['t.organization_id = $1']
  const params: unknown[] = [organizationId]
  let i = 2

  if (filters.project_id) {
    conditions.push(`t.project_id = $${i++}`)
    params.push(filters.project_id)
  }
  if (filters.priority) {
    conditions.push(`t.priority = $${i++}`)
    params.push(filters.priority)
  }
  if (filters.column_id) {
    conditions.push(`t.column_id = $${i++}`)
    params.push(filters.column_id)
  }
  if (filters.stage) {
    conditions.push(`t.stage = $${i++}`)
    params.push(filters.stage)

    // Une tâche différée est masquée du tri jusqu'à sa date de réapparition.
    // Ne s'applique qu'à l'inbox : on veut pouvoir consulter le backlog en entier.
    if (filters.stage === 'inbox') {
      conditions.push('(t.snooze_until IS NULL OR t.snooze_until <= CURRENT_DATE)')
    }
  }

  const result = await db.query<Task>(
    `SELECT t.*
     FROM task t
     WHERE ${conditions.join(' AND ')}
     ORDER BY t.project_id NULLS FIRST, t.column_id NULLS FIRST, t.position ASC, t.created_at DESC`,
    params
  )
  return result.rows
}

// ─── Capture / Inbox (functional-spec §3.9) ──────────────────────────────────

/** Capture rapide : un titre, rien d'autre. Ni projet, ni colonne, ni position. */
export async function captureTask(organizationId: string, title: string): Promise<Task> {
  const result = await db.query<Task>(
    `INSERT INTO task (organization_id, title, stage) VALUES ($1, $2, 'inbox') RETURNING *`,
    [organizationId, title]
  )
  return result.rows[0]
}

/** Tri : validation vers le backlog, report, ou abandon. */
export async function triageTask(
  taskId: string,
  organizationId: string,
  input:
    | { action: 'validate'; project_id?: string | null; due_date?: string | null }
    | { action: 'snooze'; snooze_until: string }
    | { action: 'cancel' }
): Promise<Task | null> {
  if (input.action === 'snooze') {
    const result = await db.query<Task>(
      `UPDATE task SET snooze_until = $3
       WHERE id = $1 AND organization_id = $2 AND stage = 'inbox'
       RETURNING *`,
      [taskId, organizationId, input.snooze_until]
    )
    return result.rows[0] ?? null
  }

  if (input.action === 'cancel') {
    const result = await db.query<Task>(
      `UPDATE task SET stage = 'cancelled', snooze_until = NULL
       WHERE id = $1 AND organization_id = $2
       RETURNING *`,
      [taskId, organizationId]
    )
    return result.rows[0] ?? null
  }

  // validate : passage en backlog. Le report éventuel est levé, la tâche ayant
  // été tranchée. Projet et échéance sont facultatifs à ce stade.
  const result = await db.query<Task>(
    `UPDATE task
     SET stage        = 'backlog',
         snooze_until = NULL,
         project_id   = CASE WHEN $3::boolean THEN $4::uuid ELSE project_id END,
         due_date     = CASE WHEN $5::boolean THEN $6::date ELSE due_date   END
     WHERE id = $1 AND organization_id = $2
     RETURNING *`,
    [
      taskId,
      organizationId,
      'project_id' in input, input.project_id ?? null,
      'due_date'   in input, input.due_date   ?? null,
    ]
  )
  return result.rows[0] ?? null
}

/**
 * Passage sur un board : la tâche devient `active`.
 * Le projet et la colonne sont vérifiés comme appartenant bien à l'organisation
 * ET l'un à l'autre — sans quoi on pourrait poser une tâche sur la colonne d'un
 * autre projet, voire d'un autre workspace.
 */
export async function assignTask(
  taskId: string,
  organizationId: string,
  input: { project_id: string; column_id: string; position?: number }
): Promise<Task | null> {
  const result = await db.query<Task>(
    `UPDATE task t
     SET stage      = 'active',
         project_id = $3,
         column_id  = $4,
         position   = $5
     FROM project p, kanban_column kc
     WHERE t.id = $1
       AND t.organization_id = $2
       AND p.id  = $3 AND p.organization_id  = $2
       AND kc.id = $4 AND kc.project_id      = $3
     RETURNING t.*`,
    [taskId, organizationId, input.project_id, input.column_id, input.position ?? 0]
  )
  return result.rows[0] ?? null
}

export async function findTasksByProject(
  projectId: string,
  organizationId: string
): Promise<Task[]> {
  const result = await db.query<Task>(
    `SELECT t.*,
       EXISTS (
         SELECT 1 FROM task_dependency td
         JOIN task blocker ON blocker.id = td.depends_on_id
         LEFT JOIN kanban_column col ON col.id = blocker.column_id
         WHERE td.task_id = t.id
           -- Un bloqueur hors board (inbox/backlog) n'a pas de colonne : il n'est
           -- certainement pas terminé, il bloque donc. Une jointure INTERNE
           -- l'aurait au contraire fait disparaître, rendant la tâche « libre ».
           AND (
             col.id IS NULL
             OR (col.name NOT ILIKE '%termin%'
                 AND col.name NOT ILIKE '%done%'
                 AND col.name NOT ILIKE '%complet%')
           )
       ) AS is_blocked
     FROM task t
     JOIN project p ON p.id = t.project_id
     -- Seules les tâches POSÉES SUR LE BOARD : une tâche de backlog peut porter
     -- ce projet_id (choisi au tri) sans être encore sur une colonne. La laisser
     -- passer la rendrait invisible sur le kanban tout en faussant les décomptes.
     WHERE t.project_id = $1 AND p.organization_id = $2 AND t.stage = 'active'
     ORDER BY t.column_id, t.position ASC`,
    [projectId, organizationId]
  )
  return result.rows
}

export async function findTaskById(
  taskId: string,
  projectId: string,
  organizationId: string
): Promise<Task | null> {
  const result = await db.query<Task>(
    `SELECT t.*
     FROM task t
     JOIN project p ON p.id = t.project_id
     WHERE t.id = $1 AND t.project_id = $2 AND p.organization_id = $3`,
    [taskId, projectId, organizationId]
  )
  return result.rows[0] ?? null
}

export async function createTask(projectId: string, input: CreateTaskInput): Promise<Task> {
  const result = await db.query<Task>(
    // Création depuis un board : la tâche naît directement `active` (le défaut de
    // la colonne, 'inbox', ne vaut que pour la capture rapide).
    // `organization_id` est dérivé du projet — la tâche la porte désormais elle-même,
    // pour que les tâches sans projet restent cloisonnées (cf. task_0002_inbox).
    `INSERT INTO task (organization_id, project_id, column_id, title, description, priority, due_date, start_date, estimated_hours,
                       recurrence_freq, recurrence_interval, recurrence_days, recurrence_until, stage, position)
     VALUES (
       (SELECT organization_id FROM project WHERE id = $1),
       $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'active', (
         SELECT COALESCE(MAX(position), 0) + 1 FROM task WHERE column_id = $2
       )
     )
     RETURNING *`,
    [
      projectId,
      input.column_id,
      input.title,
      input.description ?? null,
      input.priority ?? null,
      input.due_date ?? null,
      input.start_date ?? null,
      input.estimated_hours ?? null,
      input.recurrence_freq ?? null,
      input.recurrence_interval ?? 1,
      input.recurrence_days ?? null,
      input.recurrence_until ?? null,
    ]
  )
  return result.rows[0]
}

// Reprogramme une tâche récurrente : nouvelle échéance + retour en début de board
// (première colonne du projet, position 0). Cf. recurrence.service.
export async function rescheduleTask(
  taskId: string,
  projectId: string,
  organizationId: string,
  nextDue: string
): Promise<Task | null> {
  const result = await db.query<Task>(
    `UPDATE task AS t
     SET due_date  = $4,
         column_id = COALESCE(
           (SELECT id FROM kanban_column WHERE project_id = t.project_id ORDER BY position ASC LIMIT 1),
           t.column_id
         ),
         position  = 0
     FROM project p
     WHERE t.id = $1 AND t.project_id = $2 AND p.id = t.project_id AND p.organization_id = $3
     RETURNING t.*`,
    [taskId, projectId, organizationId, nextDue]
  )
  return result.rows[0] ?? null
}

export async function updateTask(
  taskId: string,
  projectId: string,
  organizationId: string,
  input: UpdateTaskInput
): Promise<Task | null> {
  const result = await db.query<Task>(
    `UPDATE task AS t
     SET title               = COALESCE($4, t.title),
         description         = CASE WHEN $5::boolean  THEN $6  ELSE t.description     END,
         priority            = CASE WHEN $7::boolean  THEN $8  ELSE t.priority        END,
         due_date            = CASE WHEN $9::boolean  THEN $10 ELSE t.due_date        END,
         start_date          = CASE WHEN $11::boolean THEN $12 ELSE t.start_date      END,
         estimated_hours     = CASE WHEN $13::boolean THEN $14 ELSE t.estimated_hours END,
         recurrence_freq     = CASE WHEN $15::boolean THEN $16 ELSE t.recurrence_freq END,
         recurrence_interval = COALESCE($17, t.recurrence_interval),
         recurrence_days     = CASE WHEN $18::boolean THEN $19 ELSE t.recurrence_days END,
         recurrence_until    = CASE WHEN $20::boolean THEN $21 ELSE t.recurrence_until END
     FROM project p
     WHERE t.id = $1 AND t.project_id = $2 AND p.id = t.project_id AND p.organization_id = $3
     RETURNING t.*`,
    [
      taskId,
      projectId,
      organizationId,
      input.title ?? null,
      'description' in input,
      input.description ?? null,
      'priority' in input,
      input.priority ?? null,
      'due_date' in input,
      input.due_date ?? null,
      'start_date' in input,
      input.start_date ?? null,
      'estimated_hours' in input,
      input.estimated_hours ?? null,
      'recurrence_freq' in input,
      input.recurrence_freq ?? null,
      input.recurrence_interval ?? null,
      'recurrence_days' in input,
      input.recurrence_days ?? null,
      'recurrence_until' in input,
      input.recurrence_until ?? null,
    ]
  )
  return result.rows[0] ?? null
}

export async function moveTask(
  taskId: string,
  projectId: string,
  organizationId: string,
  input: MoveTaskInput
): Promise<Task | null> {
  // On décale les tâches existantes dans la colonne cible pour faire de la place
  await db.query(
    `UPDATE task SET position = position + 1
     WHERE column_id = $1 AND position >= $2 AND id != $3`,
    [input.column_id, input.position, taskId]
  )

  const result = await db.query<Task>(
    `UPDATE task AS t
     SET column_id = $4, position = $5
     FROM project p
     WHERE t.id = $1 AND t.project_id = $2 AND p.id = t.project_id AND p.organization_id = $3
     RETURNING t.*`,
    [taskId, projectId, organizationId, input.column_id, input.position]
  )
  return result.rows[0] ?? null
}

export async function deleteTask(
  taskId: string,
  projectId: string,
  organizationId: string
): Promise<boolean> {
  const result = await db.query(
    `DELETE FROM task AS t
     USING project p
     WHERE t.id = $1 AND t.project_id = $2 AND p.id = t.project_id AND p.organization_id = $3`,
    [taskId, projectId, organizationId]
  )
  return (result.rowCount ?? 0) > 0
}
