import { db } from '@/lib/db'
import type { Document } from '@/features/documents/document.types'
import type { DocumentQuery } from '@/features/documents/document.schema'

interface CreateDocumentParams {
  organizationId: string
  clientId:       string
  projectId?:     string
  name:           string
  type:           string
  fileKey:        string
  fileSize:       number
  mimeType:       string
}

export async function findAllDocuments(
  organizationId: string,
  query: DocumentQuery
): Promise<Document[]> {
  const conditions: string[] = ['organization_id = $1']
  const params: unknown[] = [organizationId]
  let i = 2

  if (query.type) {
    conditions.push(`type = $${i++}`)
    params.push(query.type)
  }
  if (query.project_id) {
    conditions.push(`project_id = $${i++}`)
    params.push(query.project_id)
  }
  if (query.client_id) {
    conditions.push(`client_id = $${i++}`)
    params.push(query.client_id)
  }

  const result = await db.query<Document>(
    `SELECT * FROM document
     WHERE ${conditions.join(' AND ')}
     ORDER BY uploaded_at DESC`,
    params
  )
  return result.rows
}

export async function findDocumentById(
  id: string,
  organizationId: string
): Promise<Document | null> {
  const result = await db.query<Document>(
    `SELECT * FROM document WHERE id = $1 AND organization_id = $2`,
    [id, organizationId]
  )
  return result.rows[0] ?? null
}

export async function createDocument(params: CreateDocumentParams): Promise<Document> {
  const result = await db.query<Document>(
    `INSERT INTO document (organization_id, client_id, project_id, name, type, file_key, file_size, mime_type)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [
      params.organizationId,
      params.clientId,
      params.projectId ?? null,
      params.name,
      params.type,
      params.fileKey,
      params.fileSize,
      params.mimeType,
    ]
  )
  return result.rows[0]
}

export async function deleteDocument(id: string, organizationId: string): Promise<Document | null> {
  const result = await db.query<Document>(
    `DELETE FROM document WHERE id = $1 AND organization_id = $2 RETURNING *`,
    [id, organizationId]
  )
  return result.rows[0] ?? null
}
