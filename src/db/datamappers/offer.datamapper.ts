import { db } from '@/lib/db'
import type { Offer } from '@/features/marketing/offers/offer.types'
import type { CreateOfferInput, UpdateOfferInput, OfferQuery } from '@/features/marketing/offers/offer.schema'

export async function findAllOffers(
  organizationId: string,
  query: OfferQuery
): Promise<Offer[]> {
  const conditions: string[] = ['organization_id = $1']
  const params: unknown[] = [organizationId]
  let i = 2

  if (query.is_active !== undefined) {
    conditions.push(`is_active = $${i++}`)
    params.push(query.is_active === 'true')
  }

  const result = await db.query<Offer>(
    `SELECT * FROM offer
     WHERE ${conditions.join(' AND ')}
     ORDER BY name ASC`,
    params
  )
  return result.rows
}

export async function findOfferById(
  id: string,
  organizationId: string
): Promise<Offer | null> {
  const result = await db.query<Offer>(
    `SELECT * FROM offer WHERE id = $1 AND organization_id = $2`,
    [id, organizationId]
  )
  return result.rows[0] ?? null
}

export async function createOffer(
  organizationId: string,
  input: CreateOfferInput
): Promise<Offer> {
  const result = await db.query<Offer>(
    `INSERT INTO offer (organization_id, name, description, price, currency, billing_type, is_active)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [
      organizationId,
      input.name,
      input.description ?? null,
      input.price       ?? null,
      input.currency,
      input.billing_type,
      input.is_active,
    ]
  )
  return result.rows[0]
}

export async function updateOffer(
  id: string,
  organizationId: string,
  input: UpdateOfferInput
): Promise<Offer | null> {
  const result = await db.query<Offer>(
    `UPDATE offer
     SET name         = COALESCE($3, name),
         currency     = COALESCE($4, currency),
         billing_type = COALESCE($5, billing_type),
         is_active    = COALESCE($6, is_active),
         description  = CASE WHEN $7::boolean THEN $8  ELSE description END,
         price        = CASE WHEN $9::boolean THEN $10 ELSE price        END
     WHERE id = $1 AND organization_id = $2
     RETURNING *`,
    [
      id,
      organizationId,
      input.name         ?? null,
      input.currency     ?? null,
      input.billing_type ?? null,
      input.is_active    ?? null,
      'description' in input, input.description ?? null,
      'price'       in input, input.price       ?? null,
    ]
  )
  return result.rows[0] ?? null
}

export async function deleteOffer(id: string, organizationId: string): Promise<boolean> {
  const result = await db.query(
    `DELETE FROM offer WHERE id = $1 AND organization_id = $2`,
    [id, organizationId]
  )
  return (result.rowCount ?? 0) > 0
}
