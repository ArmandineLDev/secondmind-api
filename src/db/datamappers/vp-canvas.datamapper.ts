import { db } from '@/lib/db'
import type { VpCanvasWithRelations } from '@/features/marketing/vp-canvas/vp-canvas.types'
import type { CreateVpCanvasInput, UpdateVpCanvasInput } from '@/features/marketing/vp-canvas/vp-canvas.schema'

const SELECT_WITH_RELATIONS = `
  SELECT vpc.*, o.name AS offer_name, p.name AS persona_name
  FROM value_proposition_canvas vpc
  LEFT JOIN offer o   ON o.id = vpc.offer_id
  LEFT JOIN persona p ON p.id = vpc.persona_id
`

export async function findAllVpCanvases(organizationId: string): Promise<VpCanvasWithRelations[]> {
  const result = await db.query<VpCanvasWithRelations>(
    `${SELECT_WITH_RELATIONS} WHERE vpc.organization_id = $1 ORDER BY vpc.name ASC`,
    [organizationId]
  )
  return result.rows
}

export async function findVpCanvasById(
  id: string,
  organizationId: string
): Promise<VpCanvasWithRelations | null> {
  const result = await db.query<VpCanvasWithRelations>(
    `${SELECT_WITH_RELATIONS} WHERE vpc.id = $1 AND vpc.organization_id = $2`,
    [id, organizationId]
  )
  return result.rows[0] ?? null
}

export async function createVpCanvas(
  organizationId: string,
  input: CreateVpCanvasInput
): Promise<VpCanvasWithRelations> {
  const result = await db.query<{ id: string }>(
    `INSERT INTO value_proposition_canvas (
       organization_id, offer_id, persona_id, name,
       customer_jobs, customer_pains, customer_gains,
       products_services, pain_relievers, gain_creators
     )
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
     RETURNING id`,
    [
      organizationId,
      input.offer_id   ?? null,
      input.persona_id ?? null,
      input.name,
      input.customer_jobs     ?? null,
      input.customer_pains    ?? null,
      input.customer_gains    ?? null,
      input.products_services ?? null,
      input.pain_relievers    ?? null,
      input.gain_creators     ?? null,
    ]
  )
  return (await findVpCanvasById(result.rows[0].id, organizationId))!
}

export async function updateVpCanvas(
  id: string,
  organizationId: string,
  input: UpdateVpCanvasInput
): Promise<VpCanvasWithRelations | null> {
  const result = await db.query(
    `UPDATE value_proposition_canvas
     SET name              = COALESCE($3, name),
         offer_id          = CASE WHEN $4::boolean  THEN $5  ELSE offer_id          END,
         persona_id        = CASE WHEN $6::boolean  THEN $7  ELSE persona_id        END,
         customer_jobs     = CASE WHEN $8::boolean  THEN $9  ELSE customer_jobs     END,
         customer_pains    = CASE WHEN $10::boolean THEN $11 ELSE customer_pains    END,
         customer_gains    = CASE WHEN $12::boolean THEN $13 ELSE customer_gains    END,
         products_services = CASE WHEN $14::boolean THEN $15 ELSE products_services END,
         pain_relievers    = CASE WHEN $16::boolean THEN $17 ELSE pain_relievers    END,
         gain_creators     = CASE WHEN $18::boolean THEN $19 ELSE gain_creators     END
     WHERE id = $1 AND organization_id = $2
     RETURNING id`,
    [
      id,
      organizationId,
      input.name ?? null,
      'offer_id'          in input, input.offer_id          ?? null,
      'persona_id'        in input, input.persona_id        ?? null,
      'customer_jobs'     in input, input.customer_jobs     ?? null,
      'customer_pains'    in input, input.customer_pains    ?? null,
      'customer_gains'    in input, input.customer_gains    ?? null,
      'products_services' in input, input.products_services ?? null,
      'pain_relievers'    in input, input.pain_relievers    ?? null,
      'gain_creators'     in input, input.gain_creators     ?? null,
    ]
  )
  if (result.rowCount === 0) return null
  return findVpCanvasById(id, organizationId)
}

export async function deleteVpCanvas(id: string, organizationId: string): Promise<boolean> {
  const result = await db.query(
    `DELETE FROM value_proposition_canvas WHERE id = $1 AND organization_id = $2`,
    [id, organizationId]
  )
  return (result.rowCount ?? 0) > 0
}
