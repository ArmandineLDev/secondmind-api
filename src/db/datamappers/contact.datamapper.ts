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
    `INSERT INTO contact (organization_id, company_id, first_name, last_name, email, phone, status, notes)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [
      organizationId,
      input.company_id  ?? null,
      input.first_name,
      input.last_name,
      input.email       ?? null,
      input.phone       ?? null,
      input.status,
      input.notes       ?? null,
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
     SET first_name = COALESCE($3, first_name),
         last_name  = COALESCE($4, last_name),
         status     = COALESCE($5, status),
         email      = CASE WHEN $6::boolean THEN $7  ELSE email      END,
         phone      = CASE WHEN $8::boolean THEN $9  ELSE phone      END,
         company_id = CASE WHEN $10::boolean THEN $11 ELSE company_id END,
         notes      = CASE WHEN $12::boolean THEN $13 ELSE notes      END
     WHERE id = $1 AND organization_id = $2
     RETURNING *`,
    [
      id,
      organizationId,
      input.first_name ?? null,
      input.last_name  ?? null,
      input.status     ?? null,
      'email'      in input, input.email      ?? null,
      'phone'      in input, input.phone      ?? null,
      'company_id' in input, input.company_id ?? null,
      'notes'      in input, input.notes      ?? null,
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
