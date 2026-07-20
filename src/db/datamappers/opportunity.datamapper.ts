import { db } from '@/lib/db'
import type { Opportunity, OpportunityWithRelations } from '@/features/crm/opportunities/opportunity.types'
import type { CreateOpportunityInput, UpdateOpportunityInput, OpportunityQuery } from '@/features/crm/opportunities/opportunity.schema'

export async function findAllOpportunities(
  organizationId: string,
  query: OpportunityQuery
): Promise<OpportunityWithRelations[]> {
  const conditions: string[] = ['op.organization_id = $1']
  const params: unknown[] = [organizationId]
  let i = 2

  if (query.stage) {
    conditions.push(`op.stage = $${i++}`)
    params.push(query.stage)
  }
  if (query.contact_id) {
    conditions.push(`op.contact_id = $${i++}`)
    params.push(query.contact_id)
  }
  if (query.company_id) {
    conditions.push(`op.company_id = $${i++}`)
    params.push(query.company_id)
  }

  const result = await db.query<OpportunityWithRelations>(
    `SELECT op.*,
            ct.first_name   AS contact_first_name,
            ct.last_name    AS contact_last_name,
            co.name         AS company_name,
            CASE WHEN op.value IS NOT NULL AND op.probability IS NOT NULL
                 THEN (op.value * op.probability / 100)::numeric(12,2)
                 ELSE NULL
            END             AS weighted_value
     FROM opportunity op
     LEFT JOIN contact ct ON ct.id = op.contact_id
     LEFT JOIN company co ON co.id = op.company_id
     WHERE ${conditions.join(' AND ')}
     ORDER BY op.created_at DESC`,
    params
  )
  return result.rows
}

export async function findOpportunityById(
  id: string,
  organizationId: string
): Promise<OpportunityWithRelations | null> {
  const result = await db.query<OpportunityWithRelations>(
    `SELECT op.*,
            ct.first_name   AS contact_first_name,
            ct.last_name    AS contact_last_name,
            co.name         AS company_name,
            CASE WHEN op.value IS NOT NULL AND op.probability IS NOT NULL
                 THEN (op.value * op.probability / 100)::numeric(12,2)
                 ELSE NULL
            END             AS weighted_value
     FROM opportunity op
     LEFT JOIN contact ct ON ct.id = op.contact_id
     LEFT JOIN company co ON co.id = op.company_id
     WHERE op.id = $1 AND op.organization_id = $2`,
    [id, organizationId]
  )
  return result.rows[0] ?? null
}

export async function createOpportunity(
  organizationId: string,
  input: CreateOpportunityInput
): Promise<Opportunity> {
  const result = await db.query<Opportunity>(
    `INSERT INTO opportunity (organization_id, contact_id, company_id, title, value, stage, probability, notes, closed_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
    [
      organizationId,
      input.contact_id  ?? null,
      input.company_id  ?? null,
      input.title,
      input.value       ?? null,
      input.stage,
      input.probability ?? null,
      input.notes       ?? null,
      input.closed_at   ?? null,
    ]
  )
  return result.rows[0]
}

export async function updateOpportunity(
  id: string,
  organizationId: string,
  input: UpdateOpportunityInput
): Promise<Opportunity | null> {
  const result = await db.query<Opportunity>(
    `UPDATE opportunity
     SET title       = COALESCE($3, title),
         stage       = COALESCE($4, stage),
         contact_id  = CASE WHEN $5::boolean  THEN $6  ELSE contact_id  END,
         company_id  = CASE WHEN $7::boolean  THEN $8  ELSE company_id  END,
         value       = CASE WHEN $9::boolean  THEN $10 ELSE value       END,
         probability = CASE WHEN $11::boolean THEN $12 ELSE probability END,
         notes       = CASE WHEN $13::boolean THEN $14 ELSE notes       END,
         closed_at   = CASE WHEN $15::boolean THEN $16 ELSE closed_at   END
     WHERE id = $1 AND organization_id = $2
     RETURNING *`,
    [
      id,
      organizationId,
      input.title       ?? null,
      input.stage       ?? null,
      'contact_id'  in input, input.contact_id  ?? null,
      'company_id'  in input, input.company_id  ?? null,
      'value'       in input, input.value       ?? null,
      'probability' in input, input.probability ?? null,
      'notes'       in input, input.notes       ?? null,
      'closed_at'   in input, input.closed_at   ?? null,
    ]
  )
  return result.rows[0] ?? null
}

export async function deleteOpportunity(id: string, organizationId: string): Promise<boolean> {
  const result = await db.query(
    `DELETE FROM opportunity WHERE id = $1 AND organization_id = $2`,
    [id, organizationId]
  )
  return (result.rowCount ?? 0) > 0
}
