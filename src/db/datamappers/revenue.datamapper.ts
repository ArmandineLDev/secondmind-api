import { db } from '@/lib/db'
import type { Revenue } from '@/features/finance/revenues/revenue.types'
import type { CreateRevenueInput, UpdateRevenueInput, RevenueQuery } from '@/features/finance/revenues/revenue.schema'

export async function findAllRevenues(organizationId: string, query: RevenueQuery): Promise<Revenue[]> {
  const conditions: string[] = ['organization_id = $1']
  const params: unknown[] = [organizationId]
  let i = 2

  if (query.project_id) { conditions.push(`project_id = $${i++}`); params.push(query.project_id) }
  if (query.year)        { conditions.push(`EXTRACT(YEAR  FROM date) = $${i++}`); params.push(query.year) }
  if (query.month)       { conditions.push(`EXTRACT(MONTH FROM date) = $${i++}`); params.push(query.month) }

  const result = await db.query<Revenue>(
    `SELECT * FROM revenue WHERE ${conditions.join(' AND ')} ORDER BY date DESC`,
    params
  )
  return result.rows
}

export async function findRevenueById(id: string, organizationId: string): Promise<Revenue | null> {
  const result = await db.query<Revenue>(
    `SELECT * FROM revenue WHERE id = $1 AND organization_id = $2`,
    [id, organizationId]
  )
  return result.rows[0] ?? null
}

export async function createRevenue(organizationId: string, input: CreateRevenueInput): Promise<Revenue> {
  const result = await db.query<Revenue>(
    `INSERT INTO revenue (organization_id, project_id, contact_id, amount, currency, date, description)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [organizationId, input.project_id ?? null, input.contact_id ?? null, input.amount, input.currency, input.date, input.description ?? null]
  )
  return result.rows[0]
}

export async function updateRevenue(id: string, organizationId: string, input: UpdateRevenueInput): Promise<Revenue | null> {
  const result = await db.query<Revenue>(
    `UPDATE revenue
     SET amount      = COALESCE($3, amount),
         currency    = COALESCE($4, currency),
         date        = COALESCE($5, date),
         description = CASE WHEN $6::boolean THEN $7  ELSE description END,
         project_id  = CASE WHEN $8::boolean THEN $9  ELSE project_id  END,
         contact_id  = CASE WHEN $10::boolean THEN $11 ELSE contact_id  END
     WHERE id = $1 AND organization_id = $2
     RETURNING *`,
    [
      id, organizationId,
      input.amount   ?? null,
      input.currency ?? null,
      input.date     ?? null,
      'description' in input, input.description ?? null,
      'project_id'  in input, input.project_id  ?? null,
      'contact_id'  in input, input.contact_id  ?? null,
    ]
  )
  return result.rows[0] ?? null
}

export async function deleteRevenue(id: string, organizationId: string): Promise<boolean> {
  const result = await db.query(`DELETE FROM revenue WHERE id = $1 AND organization_id = $2`, [id, organizationId])
  return (result.rowCount ?? 0) > 0
}
