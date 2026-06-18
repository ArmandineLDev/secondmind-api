import { db } from '@/lib/db'
import type { Project, KanbanColumn } from '@/features/projects/project.types'
import type { Task }                  from '@/features/tasks/task.types'
import type { Document }              from '@/features/documents/document.types'

export async function findClientProjects(clientId: string): Promise<Project[]> {
  const result = await db.query<Project>(
    `SELECT p.*
     FROM project p
     JOIN project_client pc ON pc.project_id = p.id
     WHERE pc.client_id = $1 AND p.is_archived = false
     ORDER BY p.created_at DESC`,
    [clientId]
  )
  return result.rows
}

export async function findClientProjectById(
  projectId: string,
  clientId: string
): Promise<Project | null> {
  const result = await db.query<Project>(
    `SELECT p.*
     FROM project p
     JOIN project_client pc ON pc.project_id = p.id
     WHERE p.id = $1 AND pc.client_id = $2`,
    [projectId, clientId]
  )
  return result.rows[0] ?? null
}

export async function findClientProjectColumns(
  projectId: string,
  clientId: string
): Promise<KanbanColumn[]> {
  const result = await db.query<KanbanColumn>(
    `SELECT kc.*
     FROM kanban_column kc
     JOIN project_client pc ON pc.project_id = kc.project_id
     WHERE kc.project_id = $1 AND pc.client_id = $2
     ORDER BY kc.position ASC`,
    [projectId, clientId]
  )
  return result.rows
}

export async function findClientProjectTasks(
  projectId: string,
  clientId: string
): Promise<Task[]> {
  const result = await db.query<Task>(
    `SELECT t.*
     FROM task t
     JOIN project_client pc ON pc.project_id = t.project_id
     WHERE t.project_id = $1 AND pc.client_id = $2
     ORDER BY t.column_id, t.position ASC`,
    [projectId, clientId]
  )
  return result.rows
}

export async function findClientDocuments(clientId: string): Promise<Document[]> {
  const result = await db.query<Document>(
    `SELECT * FROM document WHERE client_id = $1 ORDER BY uploaded_at DESC`,
    [clientId]
  )
  return result.rows
}

export async function findClientDocumentById(
  id: string,
  clientId: string
): Promise<Document | null> {
  const result = await db.query<Document>(
    `SELECT * FROM document WHERE id = $1 AND client_id = $2`,
    [id, clientId]
  )
  return result.rows[0] ?? null
}

// Gestion des affectations (utilisé par les owners depuis les paramètres)
export async function assignClientToProject(
  projectId: string,
  clientId: string
): Promise<void> {
  await db.query(
    `INSERT INTO project_client (project_id, client_id)
     VALUES ($1, $2)
     ON CONFLICT (project_id, client_id) DO NOTHING`,
    [projectId, clientId]
  )
}

export async function removeClientFromProject(
  projectId: string,
  clientId: string
): Promise<boolean> {
  const result = await db.query(
    `DELETE FROM project_client WHERE project_id = $1 AND client_id = $2`,
    [projectId, clientId]
  )
  return (result.rowCount ?? 0) > 0
}

export async function findProjectClients(projectId: string): Promise<string[]> {
  const result = await db.query<{ client_id: string }>(
    `SELECT client_id FROM project_client WHERE project_id = $1`,
    [projectId]
  )
  return result.rows.map((r) => r.client_id)
}
