import { db } from '@/lib/db'
import type { Invoice } from '@/features/finance/invoices/invoice.types'
import type { CreateInvoiceInput, UpdateInvoiceInput, InvoiceQuery } from '@/features/finance/invoices/invoice.schema'

export async function findAllInvoices(organizationId: string, query: InvoiceQuery): Promise<Invoice[]> {
  const conditions: string[] = ['organization_id = $1']
  const params: unknown[] = [organizationId]
  let i = 2

  if (query.type)       { conditions.push(`type = $${i++}`);       params.push(query.type) }
  if (query.status)     { conditions.push(`status = $${i++}`);     params.push(query.status) }
  if (query.project_id) { conditions.push(`project_id = $${i++}`); params.push(query.project_id) }
  if (query.year)       { conditions.push(`EXTRACT(YEAR FROM issue_date) = $${i++}`); params.push(query.year) }

  const result = await db.query<Invoice>(
    `SELECT * FROM invoice WHERE ${conditions.join(' AND ')} ORDER BY issue_date DESC`,
    params
  )
  return result.rows
}

export async function findInvoiceById(id: string, organizationId: string): Promise<Invoice | null> {
  const result = await db.query<Invoice>(
    `SELECT * FROM invoice WHERE id = $1 AND organization_id = $2`,
    [id, organizationId]
  )
  return result.rows[0] ?? null
}

export async function createInvoice(organizationId: string, input: CreateInvoiceInput): Promise<Invoice> {
  const result = await db.query<Invoice>(
    `INSERT INTO invoice (organization_id, type, company_id, contact_id, project_id, reference, amount, currency, issue_date, due_date, status, notes, paid_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *`,
    [organizationId, input.type, input.company_id ?? null, input.contact_id ?? null, input.project_id ?? null, input.reference ?? null,
     input.amount, input.currency, input.issue_date, input.due_date ?? null, input.status, input.notes ?? null, input.paid_at ?? null]
  )
  return result.rows[0]
}

export async function updateInvoice(id: string, organizationId: string, input: UpdateInvoiceInput): Promise<Invoice | null> {
  const result = await db.query<Invoice>(
    `UPDATE invoice
     SET type       = COALESCE($3, type),
         amount     = COALESCE($4, amount),
         currency   = COALESCE($5, currency),
         issue_date = COALESCE($6, issue_date),
         status     = COALESCE($7, status),
         company_id = CASE WHEN $8::boolean  THEN $9  ELSE company_id END,
         contact_id = CASE WHEN $10::boolean THEN $11 ELSE contact_id END,
         project_id = CASE WHEN $12::boolean THEN $13 ELSE project_id END,
         reference  = CASE WHEN $14::boolean THEN $15 ELSE reference  END,
         due_date   = CASE WHEN $16::boolean THEN $17 ELSE due_date   END,
         notes      = CASE WHEN $18::boolean THEN $19 ELSE notes      END,
         paid_at    = CASE WHEN $20::boolean THEN $21 ELSE paid_at    END
     WHERE id = $1 AND organization_id = $2
     RETURNING *`,
    [
      id, organizationId,
      input.type       ?? null,
      input.amount     ?? null,
      input.currency   ?? null,
      input.issue_date ?? null,
      input.status     ?? null,
      'company_id' in input, input.company_id ?? null,
      'contact_id' in input, input.contact_id ?? null,
      'project_id' in input, input.project_id ?? null,
      'reference'  in input, input.reference  ?? null,
      'due_date'   in input, input.due_date   ?? null,
      'notes'      in input, input.notes      ?? null,
      'paid_at'    in input, input.paid_at    ?? null,
    ]
  )
  return result.rows[0] ?? null
}

export async function deleteInvoice(id: string, organizationId: string): Promise<boolean> {
  const result = await db.query(`DELETE FROM invoice WHERE id = $1 AND organization_id = $2`, [id, organizationId])
  return (result.rowCount ?? 0) > 0
}
