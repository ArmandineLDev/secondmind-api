import { db } from '@/lib/db'
import type { Task } from '@/features/tasks/task.types'

export interface TaskDependency {
  task_id: string
  depends_on_id: string
}

export interface TaskDependencyWithTask extends TaskDependency {
  depends_on: Pick<Task, 'id' | 'title' | 'column_id' | 'priority'>
}

export async function findDependencies(taskId: string, projectId: string): Promise<TaskDependencyWithTask[]> {
  const result = await db.query<TaskDependencyWithTask>(
    `SELECT
       td.task_id,
       td.depends_on_id,
       json_build_object(
         'id',        dep.id,
         'title',     dep.title,
         'column_id', dep.column_id,
         'priority',  dep.priority
       ) AS depends_on
     FROM task_dependency td
     JOIN task dep ON dep.id = td.depends_on_id
     WHERE td.task_id = $1 AND dep.project_id = $2`,
    [taskId, projectId]
  )
  return result.rows
}

export async function addDependency(taskId: string, dependsOnId: string): Promise<TaskDependency> {
  const result = await db.query<TaskDependency>(
    `INSERT INTO task_dependency (task_id, depends_on_id)
     VALUES ($1, $2)
     ON CONFLICT DO NOTHING
     RETURNING *`,
    [taskId, dependsOnId]
  )
  return result.rows[0]
}

export async function removeDependency(taskId: string, dependsOnId: string): Promise<boolean> {
  const result = await db.query(
    `DELETE FROM task_dependency WHERE task_id = $1 AND depends_on_id = $2`,
    [taskId, dependsOnId]
  )
  return (result.rowCount ?? 0) > 0
}

export async function findBlockedTasks(projectId: string): Promise<string[]> {
  const result = await db.query<{ task_id: string }>(
    `SELECT DISTINCT td.task_id
     FROM task_dependency td
     JOIN task t_blocker ON t_blocker.id = td.depends_on_id
     JOIN kanban_column col ON col.id = t_blocker.column_id
     WHERE t_blocker.project_id = $1
       AND col.name NOT ILIKE '%termin%'
       AND col.name NOT ILIKE '%done%'
       AND col.name NOT ILIKE '%complet%'`,
    [projectId]
  )
  return result.rows.map((r) => r.task_id)
}
