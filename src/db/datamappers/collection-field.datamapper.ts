import { db } from '@/lib/db'
import type { CollectionField } from '@/features/collections/collection.types'
import type { CreateFieldInput, UpdateFieldInput } from '@/features/collections/fields/field.schema'

export async function findFieldsByCollection(collectionId: string): Promise<CollectionField[]> {
  const result = await db.query<CollectionField>(
    `SELECT * FROM collection_field WHERE collection_id = $1 ORDER BY position ASC, name ASC`,
    [collectionId]
  )
  return result.rows
}

export async function findFieldById(
  fieldId: string,
  collectionId: string
): Promise<CollectionField | null> {
  const result = await db.query<CollectionField>(
    `SELECT * FROM collection_field WHERE id = $1 AND collection_id = $2`,
    [fieldId, collectionId]
  )
  return result.rows[0] ?? null
}

export async function createField(
  collectionId: string,
  input: CreateFieldInput
): Promise<CollectionField> {
  const result = await db.query<CollectionField>(
    `INSERT INTO collection_field (collection_id, name, type, options, position)
     VALUES ($1, $2, $3, $4, COALESCE($5, (
       -- Nouvelle colonne ajoutée à droite des existantes.
       SELECT COALESCE(MAX(position), -1) + 1 FROM collection_field WHERE collection_id = $1
     )))
     RETURNING *`,
    [
      collectionId,
      input.name,
      input.type,
      input.options ? JSON.stringify(input.options) : null,
      input.position ?? null,
    ]
  )
  return result.rows[0]
}

/**
 * Met à jour une colonne, et reprend au passage les valeurs déjà saisies.
 *
 * `type` et `options` sont ici les valeurs **effectives** déjà arbitrées par le
 * service : le datamapper ne fait pas de COALESCE dessus, sinon la règle
 * « select ⇄ options » lui échapperait et le CHECK en base sauterait.
 *
 * `convertValue` n'est fourni que si le type change. Il est appliqué à chaque
 * entrée dans la même transaction que l'ALTER logique : une valeur qui ne se
 * convertit pas (`undefined`) est retirée, faute de quoi la colonne
 * contiendrait des données que plus rien ne sait afficher.
 */
export async function updateField(
  fieldId: string,
  collectionId: string,
  input: Omit<UpdateFieldInput, 'type' | 'options'> & {
    type: CollectionField['type']
    options: string[] | null
  },
  convertValue?: (value: unknown) => unknown | undefined
): Promise<CollectionField | null> {
  const client = await db.connect()
  try {
    await client.query('BEGIN')

    const result = await client.query<CollectionField>(
      `UPDATE collection_field
       SET name     = COALESCE($3, name),
           type     = $4,
           options  = $5::jsonb,
           position = COALESCE($6, position)
       WHERE id = $1 AND collection_id = $2
       RETURNING *`,
      [
        fieldId,
        collectionId,
        input.name ?? null,
        input.type,
        input.options ? JSON.stringify(input.options) : null,
        input.position ?? null,
      ]
    )

    if (result.rowCount === 0) {
      await client.query('ROLLBACK')
      return null
    }

    if (convertValue) {
      const items = await client.query<{ id: string; value: unknown }>(
        `SELECT id, data -> $1 AS value
         FROM collection_item
         WHERE collection_id = $2 AND data ? $1`,
        [fieldId, collectionId]
      )

      for (const item of items.rows) {
        const converted = convertValue(item.value)
        if (converted === undefined) {
          await client.query(`UPDATE collection_item SET data = data - $1 WHERE id = $2`, [fieldId, item.id])
        } else {
          await client.query(
            `UPDATE collection_item SET data = jsonb_set(data, ARRAY[$1], $2::jsonb) WHERE id = $3`,
            [fieldId, JSON.stringify(converted), item.id]
          )
        }
      }
    }

    await client.query('COMMIT')
    return result.rows[0]
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

/**
 * Supprime une colonne ET les valeurs correspondantes dans toutes les entrées.
 *
 * Sans le second temps, `data` conserverait indéfiniment des clés pointant vers
 * un champ disparu : invisibles à l'écran, elles gonfleraient le JSONB et
 * réapparaîtraient à l'export.
 */
export async function deleteField(fieldId: string, collectionId: string): Promise<boolean> {
  const client = await db.connect()
  try {
    await client.query('BEGIN')

    const deleted = await client.query(
      `DELETE FROM collection_field WHERE id = $1 AND collection_id = $2`,
      [fieldId, collectionId]
    )

    if ((deleted.rowCount ?? 0) === 0) {
      await client.query('ROLLBACK')
      return false
    }

    await client.query(
      `UPDATE collection_item SET data = data - $1 WHERE collection_id = $2 AND data ? $1`,
      [fieldId, collectionId]
    )

    await client.query('COMMIT')
    return true
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}
