import { db } from '@/lib/db'
import type { CollectionItem } from '@/features/collections/collection.types'

export async function findItemsByCollection(collectionId: string): Promise<CollectionItem[]> {
  const result = await db.query<CollectionItem>(
    `SELECT * FROM collection_item WHERE collection_id = $1 ORDER BY created_at ASC`,
    [collectionId]
  )
  return result.rows
}

export async function createItem(
  collectionId: string,
  data: Record<string, unknown>
): Promise<CollectionItem> {
  const result = await db.query<CollectionItem>(
    `INSERT INTO collection_item (collection_id, data) VALUES ($1, $2::jsonb) RETURNING *`,
    [collectionId, JSON.stringify(data)]
  )
  return result.rows[0]
}

/**
 * Remplace intégralement les valeurs d'une entrée.
 *
 * Remplacement et non fusion : l'éditeur de type tableur renvoie toujours la
 * ligne entière, et une fusion (`data || $3`) rendrait impossible le vidage
 * d'une cellule — la clé absente serait interprétée comme « ne pas toucher ».
 */
export async function updateItem(
  itemId: string,
  collectionId: string,
  data: Record<string, unknown>
): Promise<CollectionItem | null> {
  const result = await db.query<CollectionItem>(
    `UPDATE collection_item SET data = $3::jsonb
     WHERE id = $1 AND collection_id = $2
     RETURNING *`,
    [itemId, collectionId, JSON.stringify(data)]
  )
  return result.rows[0] ?? null
}

export async function deleteItem(itemId: string, collectionId: string): Promise<boolean> {
  const result = await db.query(
    `DELETE FROM collection_item WHERE id = $1 AND collection_id = $2`,
    [itemId, collectionId]
  )
  return (result.rowCount ?? 0) > 0
}
