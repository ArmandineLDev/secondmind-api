import { db } from '@/lib/db'
import type { Project } from '@/features/projects/project.types'
import type { CreateProjectInput, UpdateProjectInput } from '@/features/projects/project.schema'

export async function findAllProjects(organizationId: string, archived = false): Promise<Project[]> {
  const result = await db.query<Project>(
    `SELECT * FROM project
     WHERE organization_id = $1 AND is_archived = $2
     ORDER BY is_default DESC, created_at DESC`,
    [organizationId, archived]
  )
  return result.rows
}

export async function findProjectById(id: string, organizationId: string): Promise<Project | null> {
  const result = await db.query<Project>(
    `SELECT * FROM project WHERE id = $1 AND organization_id = $2`,
    [id, organizationId]
  )
  return result.rows[0] ?? null
}

export async function createProject(
  organizationId: string,
  input: CreateProjectInput
): Promise<Project> {
  const result = await db.query<Project>(
    `INSERT INTO project (organization_id, name, description, status, start_date, end_date)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [
      organizationId,
      input.name,
      input.description ?? null,
      input.status ?? 'not_started',
      input.start_date ?? null,
      input.end_date ?? null,
    ]
  )
  return result.rows[0]
}

export async function updateProject(
  id: string,
  organizationId: string,
  input: UpdateProjectInput
): Promise<Project | null> {
  const result = await db.query<Project>(
    `UPDATE project
     SET name        = COALESCE($3, name),
         description = CASE WHEN $4::boolean THEN $5  ELSE description END,
         status      = COALESCE($6, status),
         start_date  = CASE WHEN $7::boolean THEN $8  ELSE start_date  END,
         end_date    = CASE WHEN $9::boolean THEN $10 ELSE end_date    END
     WHERE id = $1 AND organization_id = $2
     RETURNING *`,
    [
      id,
      organizationId,
      input.name ?? null,
      'description' in input,
      input.description ?? null,
      input.status ?? null,
      'start_date' in input,
      input.start_date ?? null,
      'end_date' in input,
      input.end_date ?? null,
    ]
  )
  return result.rows[0] ?? null
}

export async function archiveProject(
  id: string,
  organizationId: string,
  archive: boolean
): Promise<Project | null> {
  const result = await db.query<Project>(
    `UPDATE project
     SET is_archived = $3,
         archived_at = CASE WHEN $3 THEN now() ELSE NULL END
     WHERE id = $1 AND organization_id = $2 AND is_default = false
     RETURNING *`,
    [id, organizationId, archive]
  )
  return result.rows[0] ?? null
}

export async function deleteProject(id: string, organizationId: string): Promise<boolean> {
  const result = await db.query(
    `DELETE FROM project WHERE id = $1 AND organization_id = $2 AND is_default = false`,
    [id, organizationId]
  )
  return (result.rowCount ?? 0) > 0
}
