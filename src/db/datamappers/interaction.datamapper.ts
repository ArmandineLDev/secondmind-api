import { db } from '@/lib/db'
import type { Interaction } from '@/features/crm/interactions/interaction.types'
import type { CreateInteractionInput, UpdateInteractionInput } from '@/features/crm/interactions/interaction.schema'

export async function findInteractionsByContact(
  contactId: string,
  organizationId: string
): Promise<Interaction[]> {
  const result = await db.query<Interaction>(
    `SELECT i.*
     FROM interaction i
     JOIN contact ct ON ct.id = i.contact_id
     WHERE i.contact_id = $1 AND ct.organization_id = $2
     ORDER BY i.date DESC, i.created_at DESC`,
    [contactId, organizationId]
  )
  return result.rows
}

export async function findInteractionById(
  id: string,
  contactId: string,
  organizationId: string
): Promise<Interaction | null> {
  const result = await db.query<Interaction>(
    `SELECT i.*
     FROM interaction i
     JOIN contact ct ON ct.id = i.contact_id
     WHERE i.id = $1 AND i.contact_id = $2 AND ct.organization_id = $3`,
    [id, contactId, organizationId]
  )
  return result.rows[0] ?? null
}

export async function createInteraction(
  contactId: string,
  input: CreateInteractionInput
): Promise<Interaction> {
  const result = await db.query<Interaction>(
    `INSERT INTO interaction (contact_id, lead_id, type, date, notes)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [contactId, input.lead_id ?? null, input.type, input.date, input.notes ?? null]
  )
  return result.rows[0]
}

export async function updateInteraction(
  id: string,
  contactId: string,
  organizationId: string,
  input: UpdateInteractionInput
): Promise<Interaction | null> {
  const result = await db.query<Interaction>(
    `UPDATE interaction AS i
     SET type    = COALESCE($4, i.type),
         date    = COALESCE($5, i.date),
         lead_id = CASE WHEN $6::boolean THEN $7 ELSE i.lead_id END,
         notes   = CASE WHEN $8::boolean THEN $9 ELSE i.notes   END
     FROM contact ct
     WHERE i.id = $1 AND i.contact_id = $2 AND ct.id = i.contact_id AND ct.organization_id = $3
     RETURNING i.*`,
    [
      id,
      contactId,
      organizationId,
      input.type  ?? null,
      input.date  ?? null,
      'lead_id' in input, input.lead_id ?? null,
      'notes'   in input, input.notes   ?? null,
    ]
  )
  return result.rows[0] ?? null
}

export async function deleteInteraction(
  id: string,
  contactId: string,
  organizationId: string
): Promise<boolean> {
  const result = await db.query(
    `DELETE FROM interaction AS i
     USING contact ct
     WHERE i.id = $1 AND i.contact_id = $2 AND ct.id = i.contact_id AND ct.organization_id = $3`,
    [id, contactId, organizationId]
  )
  return (result.rowCount ?? 0) > 0
}
