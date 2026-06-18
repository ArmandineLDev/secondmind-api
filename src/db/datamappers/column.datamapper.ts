import { db } from '@/lib/db'
import type { KanbanColumn } from '@/features/projects/project.types'
import type { CreateColumnInput, UpdateColumnInput } from '@/features/projects/columns/column.schema'

export async function findColumnsByProject(projectId: string): Promise<KanbanColumn[]> {
  const result = await db.query<KanbanColumn>(
    `SELECT * FROM kanban_column WHERE project_id = $1 ORDER BY position ASC`,
    [projectId]
  )
  return result.rows
}

export async function findColumnById(id: string, projectId: string): Promise<KanbanColumn | null> {
  const result = await db.query<KanbanColumn>(
    `SELECT * FROM kanban_column WHERE id = $1 AND project_id = $2`,
    [id, projectId]
  )
  return result.rows[0] ?? null
}

export async function createColumn(
  projectId: string,
  input: CreateColumnInput
): Promise<KanbanColumn> {
  const result = await db.query<KanbanColumn>(
    `INSERT INTO kanban_column (project_id, name, color, position)
     VALUES ($1, $2, $3, (
       SELECT COALESCE(MAX(position), 0) + 1 FROM kanban_column WHERE project_id = $1
     ))
     RETURNING *`,
    [projectId, input.name, input.color ?? null]
  )
  return result.rows[0]
}

export async function createDefaultColumns(projectId: string): Promise<KanbanColumn[]> {
  const defaults = [
    { name: 'À faire', color: null, position: 1 },
    { name: 'En cours', color: '#c8714f', position: 2 },
    { name: 'Terminé', color: '#2d8a52', position: 3 },
  ]

  const result = await db.query<KanbanColumn>(
    `INSERT INTO kanban_column (project_id, name, color, position)
     SELECT $1, col.name, col.color, col.position
     FROM jsonb_to_recordset($2::jsonb) AS col(name text, color text, position int)
     RETURNING *`,
    [projectId, JSON.stringify(defaults)]
  )
  return result.rows
}

export async function updateColumn(
  id: string,
  projectId: string,
  input: UpdateColumnInput
): Promise<KanbanColumn | null> {
  const result = await db.query<KanbanColumn>(
    `UPDATE kanban_column
     SET name  = COALESCE($3, name),
         color = CASE WHEN $4::boolean THEN $5 ELSE color END
     WHERE id = $1 AND project_id = $2
     RETURNING *`,
    [id, projectId, input.name ?? null, 'color' in input, input.color ?? null]
  )
  return result.rows[0] ?? null
}

export async function deleteColumn(id: string, projectId: string): Promise<boolean> {
  const result = await db.query(
    `DELETE FROM kanban_column WHERE id = $1 AND project_id = $2`,
    [id, projectId]
  )
  return (result.rowCount ?? 0) > 0
}

export async function reorderColumns(projectId: string, order: string[]): Promise<void> {
  // On construit une mise à jour par lot via unnest
  await db.query(
    `UPDATE kanban_column AS c
     SET position = v.pos
     FROM (
       SELECT unnest($1::uuid[]) AS id, generate_series(1, $2) AS pos
     ) AS v
     WHERE c.id = v.id AND c.project_id = $3`,
    [order, order.length, projectId]
  )
}
