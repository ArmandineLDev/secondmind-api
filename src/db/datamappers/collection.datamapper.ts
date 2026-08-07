import { db } from '@/lib/db'
import type { Collection, CollectionField, CollectionWithFields } from '@/features/collections/collection.types'
import type { CreateCollectionInput, UpdateCollectionInput, CollectionQuery } from '@/features/collections/collection.schema'

export async function findAllCollections(
  organizationId: string,
  query: CollectionQuery
): Promise<Collection[]> {
  const conditions: string[] = ['organization_id = $1']
  const params: unknown[] = [organizationId]

  if (query.project_id) {
    conditions.push('project_id = $2')
    params.push(query.project_id)
  }

  const result = await db.query<Collection>(
    `SELECT * FROM collection WHERE ${conditions.join(' AND ')} ORDER BY name ASC`,
    params
  )
  return result.rows
}

/** Détail d'une collection AVEC ses colonnes : l'un ne sert à rien sans l'autre. */
export async function findCollectionById(
  id: string,
  organizationId: string
): Promise<CollectionWithFields | null> {
  const collection = await db.query<Collection>(
    `SELECT * FROM collection WHERE id = $1 AND organization_id = $2`,
    [id, organizationId]
  )
  if (collection.rowCount === 0) return null

  const fields = await db.query<CollectionField>(
    `SELECT * FROM collection_field WHERE collection_id = $1 ORDER BY position ASC, name ASC`,
    [id]
  )
  return { ...collection.rows[0], fields: fields.rows }
}

export async function createCollection(
  organizationId: string,
  input: CreateCollectionInput
): Promise<Collection> {
  const result = await db.query<Collection>(
    `INSERT INTO collection (organization_id, name, icon, project_id)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [organizationId, input.name, input.icon ?? null, input.project_id ?? null]
  )
  return result.rows[0]
}

export async function updateCollection(
  id: string,
  organizationId: string,
  input: UpdateCollectionInput
): Promise<Collection | null> {
  const result = await db.query<Collection>(
    `UPDATE collection
     SET name       = COALESCE($3, name),
         icon       = CASE WHEN $4::boolean THEN $5 ELSE icon       END,
         project_id = CASE WHEN $6::boolean THEN $7 ELSE project_id END
     WHERE id = $1 AND organization_id = $2
     RETURNING *`,
    [
      id,
      organizationId,
      input.name ?? null,
      'icon'       in input, input.icon       ?? null,
      'project_id' in input, input.project_id ?? null,
    ]
  )
  return result.rows[0] ?? null
}

export async function deleteCollection(id: string, organizationId: string): Promise<boolean> {
  const result = await db.query(
    `DELETE FROM collection WHERE id = $1 AND organization_id = $2`,
    [id, organizationId]
  )
  return (result.rowCount ?? 0) > 0
}

/**
 * Vérifie qu'une collection appartient bien au workspace.
 *
 * Les champs et les entrées ne portent pas d'`organization_id` — leur
 * cloisonnement passe par la collection parente. Toute opération sur eux doit
 * donc commencer par cette vérification, sinon un id deviné suffirait à écrire
 * dans la collection d'autrui.
 */
export async function collectionBelongsToOrg(id: string, organizationId: string): Promise<boolean> {
  const result = await db.query(
    `SELECT 1 FROM collection WHERE id = $1 AND organization_id = $2`,
    [id, organizationId]
  )
  return (result.rowCount ?? 0) > 0
}
