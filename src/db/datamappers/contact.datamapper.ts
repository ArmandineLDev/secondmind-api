import { db } from '@/lib/db'
import type { Contact, ContactWithCompany } from '@/features/crm/contacts/contact.types'
import type { CreateContactInput, UpdateContactInput, ContactQuery } from '@/features/crm/contacts/contact.schema'

export async function findAllContacts(
  organizationId: string,
  query: ContactQuery
): Promise<ContactWithCompany[]> {
  const conditions: string[] = ['ct.organization_id = $1']
  const params: unknown[] = [organizationId]
  let i = 2

  if (query.search) {
    conditions.push(`(ct.first_name ILIKE $${i} OR ct.last_name ILIKE $${i} OR ct.email ILIKE $${i})`)
    params.push(`%${query.search}%`)
    i++
  }
  if (query.status) {
    conditions.push(`ct.status = $${i++}`)
    params.push(query.status)
  }
  if (query.company_id) {
    conditions.push(`ct.company_id = $${i++}`)
    params.push(query.company_id)
  }

  const result = await db.query<ContactWithCompany>(
    `SELECT ct.*, co.name AS company_name
     FROM contact ct
     LEFT JOIN company co ON co.id = ct.company_id
     WHERE ${conditions.join(' AND ')}
     ORDER BY ct.last_name ASC, ct.first_name ASC`,
    params
  )
  return result.rows
}

export async function findContactById(
  id: string,
  organizationId: string
): Promise<ContactWithCompany | null> {
  const result = await db.query<ContactWithCompany>(
    `SELECT ct.*, co.name AS company_name
     FROM contact ct
     LEFT JOIN company co ON co.id = ct.company_id
     WHERE ct.id = $1 AND ct.organization_id = $2`,
    [id, organizationId]
  )
  return result.rows[0] ?? null
}

export async function createContact(
  organizationId: string,
  input: CreateContactInput
): Promise<Contact> {
  const result = await db.query<Contact>(
    `INSERT INTO contact (
       organization_id, company_id, first_name, last_name, email, phone, status,
       source_channel, source_detail, next_follow_up_at, follow_up_note, notes
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
     RETURNING *`,
    [
      organizationId,
      input.company_id        ?? null,
      input.first_name,
      input.last_name,
      input.email             ?? null,
      input.phone             ?? null,
      input.status,
      input.source_channel    ?? null,
      input.source_detail     ?? null,
      input.next_follow_up_at ?? null,
      input.follow_up_note    ?? null,
      input.notes             ?? null,
    ]
  )
  return result.rows[0]
}

export async function updateContact(
  id: string,
  organizationId: string,
  input: UpdateContactInput
): Promise<Contact | null> {
  const result = await db.query<Contact>(
    `UPDATE contact
     SET first_name        = COALESCE($3, first_name),
         last_name         = COALESCE($4, last_name),
         status            = COALESCE($5, status),
         email             = CASE WHEN $6::boolean  THEN $7  ELSE email             END,
         phone             = CASE WHEN $8::boolean  THEN $9  ELSE phone             END,
         company_id        = CASE WHEN $10::boolean THEN $11 ELSE company_id        END,
         source_channel    = CASE WHEN $12::boolean THEN $13 ELSE source_channel    END,
         source_detail     = CASE WHEN $14::boolean THEN $15 ELSE source_detail     END,
         next_follow_up_at = CASE WHEN $16::boolean THEN $17 ELSE next_follow_up_at END,
         follow_up_note    = CASE WHEN $18::boolean THEN $19 ELSE follow_up_note    END,
         notes             = CASE WHEN $20::boolean THEN $21 ELSE notes             END
     WHERE id = $1 AND organization_id = $2
     RETURNING *`,
    [
      id,
      organizationId,
      input.first_name ?? null,
      input.last_name  ?? null,
      input.status     ?? null,
      'email'             in input, input.email             ?? null,
      'phone'             in input, input.phone             ?? null,
      'company_id'        in input, input.company_id        ?? null,
      'source_channel'    in input, input.source_channel    ?? null,
      'source_detail'     in input, input.source_detail     ?? null,
      'next_follow_up_at' in input, input.next_follow_up_at ?? null,
      'follow_up_note'    in input, input.follow_up_note    ?? null,
      'notes'             in input, input.notes             ?? null,
    ]
  )
  return result.rows[0] ?? null
}

export async function deleteContact(id: string, organizationId: string): Promise<boolean> {
  const result = await db.query(
    `DELETE FROM contact WHERE id = $1 AND organization_id = $2`,
    [id, organizationId]
  )
  return (result.rowCount ?? 0) > 0
}

// ─── RGPD ─────────────────────────────────────────────────────────────────────

export interface ContactExport {
  contact:       Record<string, unknown> | null
  company:       Record<string, unknown> | null
  social_links:  Record<string, unknown>[]
  interactions:  Record<string, unknown>[]
  opportunities: Record<string, unknown>[]
  invoices:      Record<string, unknown>[]
}

/**
 * Rassemble TOUT ce que l'organisation détient sur une personne, pour répondre
 * à une demande d'accès ou de portabilité (RGPD art. 15 et 20).
 *
 * Les factures sont incluses : elles portent le nom de la personne et relèvent
 * donc de son droit d'accès — même si elles ne peuvent pas être effacées
 * (conservation comptable obligatoire).
 */
export async function exportContactData(
  id: string,
  organizationId: string
): Promise<ContactExport | null> {
  const contact = await db.query(
    `SELECT * FROM contact WHERE id = $1 AND organization_id = $2`,
    [id, organizationId]
  )
  if (contact.rowCount === 0) return null

  const [company, socialLinks, interactions, opportunities, invoices] = await Promise.all([
    db.query(
      `SELECT co.* FROM company co
       JOIN contact ct ON ct.company_id = co.id
       WHERE ct.id = $1 AND co.organization_id = $2`,
      [id, organizationId]
    ),
    db.query(`SELECT * FROM contact_social_link WHERE contact_id = $1 ORDER BY position`, [id]),
    db.query(`SELECT * FROM interaction WHERE contact_id = $1 ORDER BY date DESC`, [id]),
    db.query(
      `SELECT * FROM opportunity WHERE contact_id = $1 AND organization_id = $2 ORDER BY created_at DESC`,
      [id, organizationId]
    ),
    db.query(
      `SELECT * FROM invoice WHERE contact_id = $1 AND organization_id = $2 ORDER BY issue_date DESC`,
      [id, organizationId]
    ),
  ])

  return {
    contact:       contact.rows[0] as Record<string, unknown>,
    company:       (company.rows[0] as Record<string, unknown>) ?? null,
    social_links:  socialLinks.rows as Record<string, unknown>[],
    interactions:  interactions.rows as Record<string, unknown>[],
    opportunities: opportunities.rows as Record<string, unknown>[],
    invoices:      invoices.rows as Record<string, unknown>[],
  }
}

/**
 * Compte ce qu'une suppression détruirait ou détacherait, pour que l'owner
 * décide en connaissance de cause avant d'effacer.
 */
export async function countContactFootprint(
  id: string,
  organizationId: string
): Promise<{ interactions: number; social_links: number; opportunities: number; invoices: number }> {
  const result = await db.query<{
    interactions: string; social_links: string; opportunities: string; invoices: string
  }>(
    `SELECT
       (SELECT COUNT(*) FROM interaction          WHERE contact_id = $1)                          AS interactions,
       (SELECT COUNT(*) FROM contact_social_link  WHERE contact_id = $1)                          AS social_links,
       (SELECT COUNT(*) FROM opportunity          WHERE contact_id = $1 AND organization_id = $2) AS opportunities,
       (SELECT COUNT(*) FROM invoice              WHERE contact_id = $1 AND organization_id = $2) AS invoices`,
    [id, organizationId]
  )
  const r = result.rows[0]
  return {
    interactions:  Number(r.interactions),
    social_links:  Number(r.social_links),
    opportunities: Number(r.opportunities),
    invoices:      Number(r.invoices),
  }
}
