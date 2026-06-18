import { db } from '@/lib/db'
import type { Task } from '@/features/tasks/task.types'
import type { CreateTaskInput, UpdateTaskInput, MoveTaskInput } from '@/features/tasks/task.schema'

export async function findAllTasks(
  organizationId: string,
  filters: { project_id?: string; priority?: string; column_id?: string }
): Promise<Task[]> {
  const conditions: string[] = ['p.organization_id = $1']
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

  const result = await db.query<Task>(
    `SELECT t.*
     FROM task t
     JOIN project p ON p.id = t.project_id
     WHERE ${conditions.join(' AND ')}
     ORDER BY t.project_id, t.column_id, t.position ASC`,
    params
  )
  return result.rows
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
         JOIN kanban_column col ON col.id = blocker.column_id
         WHERE td.task_id = t.id
           AND col.name NOT ILIKE '%termin%'
           AND col.name NOT ILIKE '%done%'
           AND col.name NOT ILIKE '%complet%'
       ) AS is_blocked
     FROM task t
     JOIN project p ON p.id = t.project_id
     WHERE t.project_id = $1 AND p.organization_id = $2
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
    `INSERT INTO task (project_id, column_id, title, description, priority, due_date, start_date, estimated_hours, position)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, (
       SELECT COALESCE(MAX(position), 0) + 1 FROM task WHERE column_id = $2
     ))
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
    ]
  )
  return result.rows[0]
}

export async function updateTask(
  taskId: string,
  projectId: string,
  organizationId: string,
  input: UpdateTaskInput
): Promise<Task | null> {
  const result = await db.query<Task>(
    `UPDATE task AS t
     SET title           = COALESCE($4, t.title),
         description     = CASE WHEN $5::boolean  THEN $6  ELSE t.description     END,
         priority        = CASE WHEN $7::boolean  THEN $8  ELSE t.priority        END,
         due_date        = CASE WHEN $9::boolean  THEN $10 ELSE t.due_date        END,
         start_date      = CASE WHEN $11::boolean THEN $12 ELSE t.start_date      END,
         estimated_hours = CASE WHEN $13::boolean THEN $14 ELSE t.estimated_hours END
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
