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
    `INSERT INTO project (organization_id, name, description, status, company_id, contact_id, start_date, end_date)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [
      organizationId,
      input.name,
      input.description ?? null,
      input.status ?? 'not_started',
      input.company_id ?? null,
      input.contact_id ?? null,
      input.start_date ?? null,
      input.end_date ?? null,
    ]
  )
  return result.rows[0]
}

// Projets réalisés pour un contact donné (fiche contact 360).
//
// Pendant de `findProjectsByCompany` : un client peut être une personne physique
// sans entreprise rattachée, auquel cas seul `contact_id` est renseigné. Les deux
// listes sont distinctes et peuvent se recouper — un projet portant les deux
// colonnes apparaît sur les deux fiches, ce qui est le comportement voulu :
// l'interlocuteur comme l'entreprise ont un intérêt légitime à le voir.
export async function findProjectsByContact(
  contactId: string,
  organizationId: string
): Promise<Project[]> {
  const result = await db.query<Project>(
    `SELECT * FROM project
     WHERE contact_id = $1 AND organization_id = $2
     ORDER BY is_archived ASC, created_at DESC`,
    [contactId, organizationId]
  )
  return result.rows
}

// Projets réalisés pour une entreprise donnée (fiche entreprise 360).
export async function findProjectsByCompany(
  companyId: string,
  organizationId: string
): Promise<Project[]> {
  const result = await db.query<Project>(
    `SELECT * FROM project
     WHERE company_id = $1 AND organization_id = $2
     ORDER BY is_archived ASC, created_at DESC`,
    [companyId, organizationId]
  )
  return result.rows
}

export async function updateProject(
  id: string,
  organizationId: string,
  input: UpdateProjectInput
): Promise<Project | null> {
  const result = await db.query<Project>(
    `UPDATE project
     SET name        = COALESCE($3, name),
         description = CASE WHEN $4::boolean  THEN $5  ELSE description END,
         status      = COALESCE($6, status),
         start_date  = CASE WHEN $7::boolean  THEN $8  ELSE start_date  END,
         end_date    = CASE WHEN $9::boolean  THEN $10 ELSE end_date    END,
         company_id  = CASE WHEN $11::boolean THEN $12 ELSE company_id  END,
         contact_id  = CASE WHEN $13::boolean THEN $14 ELSE contact_id  END
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
      'company_id' in input,
      input.company_id ?? null,
      'contact_id' in input,
      input.contact_id ?? null,
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
