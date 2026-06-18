import { db } from '@/lib/db'
import type { Canvas } from '@/features/marketing/canvases/canvas.types'
import type { CreateCanvasInput, UpdateCanvasInput } from '@/features/marketing/canvases/canvas.schema'

export async function findAllCanvases(organizationId: string): Promise<Canvas[]> {
  const result = await db.query<Canvas>(
    `SELECT * FROM canvas WHERE organization_id = $1 ORDER BY name ASC`,
    [organizationId]
  )
  return result.rows
}

export async function findCanvasById(
  id: string,
  organizationId: string
): Promise<Canvas | null> {
  const result = await db.query<Canvas>(
    `SELECT * FROM canvas WHERE id = $1 AND organization_id = $2`,
    [id, organizationId]
  )
  return result.rows[0] ?? null
}

export async function createCanvas(
  organizationId: string,
  input: CreateCanvasInput
): Promise<Canvas> {
  const result = await db.query<Canvas>(
    `INSERT INTO canvas (
       organization_id, name,
       customer_segments, value_propositions, channels, customer_relationships,
       revenue_streams, key_resources, key_activities, key_partners, cost_structure
     )
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
     RETURNING *`,
    [
      organizationId,
      input.name,
      input.customer_segments      ?? null,
      input.value_propositions     ?? null,
      input.channels               ?? null,
      input.customer_relationships ?? null,
      input.revenue_streams        ?? null,
      input.key_resources          ?? null,
      input.key_activities         ?? null,
      input.key_partners           ?? null,
      input.cost_structure         ?? null,
    ]
  )
  return result.rows[0]
}

export async function updateCanvas(
  id: string,
  organizationId: string,
  input: UpdateCanvasInput
): Promise<Canvas | null> {
  const result = await db.query<Canvas>(
    `UPDATE canvas
     SET name                   = COALESCE($3, name),
         customer_segments      = CASE WHEN $4::boolean  THEN $5  ELSE customer_segments      END,
         value_propositions     = CASE WHEN $6::boolean  THEN $7  ELSE value_propositions     END,
         channels               = CASE WHEN $8::boolean  THEN $9  ELSE channels               END,
         customer_relationships = CASE WHEN $10::boolean THEN $11 ELSE customer_relationships END,
         revenue_streams        = CASE WHEN $12::boolean THEN $13 ELSE revenue_streams        END,
         key_resources          = CASE WHEN $14::boolean THEN $15 ELSE key_resources          END,
         key_activities         = CASE WHEN $16::boolean THEN $17 ELSE key_activities         END,
         key_partners           = CASE WHEN $18::boolean THEN $19 ELSE key_partners           END,
         cost_structure         = CASE WHEN $20::boolean THEN $21 ELSE cost_structure         END
     WHERE id = $1 AND organization_id = $2
     RETURNING *`,
    [
      id,
      organizationId,
      input.name ?? null,
      'customer_segments'      in input, input.customer_segments      ?? null,
      'value_propositions'     in input, input.value_propositions     ?? null,
      'channels'               in input, input.channels               ?? null,
      'customer_relationships' in input, input.customer_relationships ?? null,
      'revenue_streams'        in input, input.revenue_streams        ?? null,
      'key_resources'          in input, input.key_resources          ?? null,
      'key_activities'         in input, input.key_activities         ?? null,
      'key_partners'           in input, input.key_partners           ?? null,
      'cost_structure'         in input, input.cost_structure         ?? null,
    ]
  )
  return result.rows[0] ?? null
}

export async function deleteCanvas(id: string, organizationId: string): Promise<boolean> {
  const result = await db.query(
    `DELETE FROM canvas WHERE id = $1 AND organization_id = $2`,
    [id, organizationId]
  )
  return (result.rowCount ?? 0) > 0
}
