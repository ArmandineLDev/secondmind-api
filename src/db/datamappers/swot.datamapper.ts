import { db } from '@/lib/db'
import type { Swot } from '@/features/marketing/swot/swot.types'
import type { CreateSwotInput, UpdateSwotInput } from '@/features/marketing/swot/swot.schema'

export async function findAllSwots(organizationId: string): Promise<Swot[]> {
  const result = await db.query<Swot>(
    `SELECT * FROM swot_analysis WHERE organization_id = $1 ORDER BY name ASC`,
    [organizationId]
  )
  return result.rows
}

export async function findSwotById(
  id: string,
  organizationId: string
): Promise<Swot | null> {
  const result = await db.query<Swot>(
    `SELECT * FROM swot_analysis WHERE id = $1 AND organization_id = $2`,
    [id, organizationId]
  )
  return result.rows[0] ?? null
}

export async function createSwot(
  organizationId: string,
  input: CreateSwotInput
): Promise<Swot> {
  const result = await db.query<Swot>(
    `INSERT INTO swot_analysis (organization_id, name, strengths, weaknesses, opportunities, threats)
     VALUES ($1,$2,$3,$4,$5,$6)
     RETURNING *`,
    [
      organizationId,
      input.name,
      input.strengths     ?? null,
      input.weaknesses    ?? null,
      input.opportunities ?? null,
      input.threats       ?? null,
    ]
  )
  return result.rows[0]
}

export async function updateSwot(
  id: string,
  organizationId: string,
  input: UpdateSwotInput
): Promise<Swot | null> {
  const result = await db.query<Swot>(
    `UPDATE swot_analysis
     SET name          = COALESCE($3, name),
         strengths     = CASE WHEN $4::boolean THEN $5  ELSE strengths     END,
         weaknesses    = CASE WHEN $6::boolean THEN $7  ELSE weaknesses    END,
         opportunities = CASE WHEN $8::boolean THEN $9  ELSE opportunities END,
         threats       = CASE WHEN $10::boolean THEN $11 ELSE threats      END
     WHERE id = $1 AND organization_id = $2
     RETURNING *`,
    [
      id,
      organizationId,
      input.name ?? null,
      'strengths'     in input, input.strengths     ?? null,
      'weaknesses'    in input, input.weaknesses    ?? null,
      'opportunities' in input, input.opportunities ?? null,
      'threats'       in input, input.threats       ?? null,
    ]
  )
  return result.rows[0] ?? null
}

export async function deleteSwot(id: string, organizationId: string): Promise<boolean> {
  const result = await db.query(
    `DELETE FROM swot_analysis WHERE id = $1 AND organization_id = $2`,
    [id, organizationId]
  )
  return (result.rowCount ?? 0) > 0
}
