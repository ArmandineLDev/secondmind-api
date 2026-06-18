import { db } from '@/lib/db'
import type { Company } from '@/features/crm/companies/company.types'
import type { CreateCompanyInput, UpdateCompanyInput } from '@/features/crm/companies/company.schema'

export async function findAllCompanies(organizationId: string): Promise<Company[]> {
  const result = await db.query<Company>(
    `SELECT * FROM company WHERE organization_id = $1 ORDER BY name ASC`,
    [organizationId]
  )
  return result.rows
}

export async function findCompanyById(id: string, organizationId: string): Promise<Company | null> {
  const result = await db.query<Company>(
    `SELECT * FROM company WHERE id = $1 AND organization_id = $2`,
    [id, organizationId]
  )
  return result.rows[0] ?? null
}

export async function createCompany(organizationId: string, input: CreateCompanyInput): Promise<Company> {
  const result = await db.query<Company>(
    `INSERT INTO company (organization_id, name, website, industry, notes)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [organizationId, input.name, input.website ?? null, input.industry ?? null, input.notes ?? null]
  )
  return result.rows[0]
}

export async function updateCompany(
  id: string,
  organizationId: string,
  input: UpdateCompanyInput
): Promise<Company | null> {
  const result = await db.query<Company>(
    `UPDATE company
     SET name     = COALESCE($3, name),
         website  = CASE WHEN $4::boolean THEN $5 ELSE website  END,
         industry = CASE WHEN $6::boolean THEN $7 ELSE industry END,
         notes    = CASE WHEN $8::boolean THEN $9 ELSE notes    END
     WHERE id = $1 AND organization_id = $2
     RETURNING *`,
    [
      id,
      organizationId,
      input.name ?? null,
      'website'  in input, input.website  ?? null,
      'industry' in input, input.industry ?? null,
      'notes'    in input, input.notes    ?? null,
    ]
  )
  return result.rows[0] ?? null
}

export async function deleteCompany(id: string, organizationId: string): Promise<boolean> {
  const result = await db.query(
    `DELETE FROM company WHERE id = $1 AND organization_id = $2`,
    [id, organizationId]
  )
  return (result.rowCount ?? 0) > 0
}
