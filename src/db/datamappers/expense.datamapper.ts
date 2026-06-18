import { db } from '@/lib/db'
import type { Expense } from '@/features/finance/expenses/expense.types'
import type { CreateExpenseInput, UpdateExpenseInput, ExpenseQuery } from '@/features/finance/expenses/expense.schema'

export async function findAllExpenses(organizationId: string, query: ExpenseQuery): Promise<Expense[]> {
  const conditions: string[] = ['organization_id = $1']
  const params: unknown[] = [organizationId]
  let i = 2

  if (query.project_id) { conditions.push(`project_id = $${i++}`); params.push(query.project_id) }
  if (query.category)   { conditions.push(`category = $${i++}`);   params.push(query.category) }
  if (query.year)       { conditions.push(`EXTRACT(YEAR FROM date) = $${i++}`); params.push(query.year) }

  const result = await db.query<Expense>(
    `SELECT * FROM expense WHERE ${conditions.join(' AND ')} ORDER BY date DESC`,
    params
  )
  return result.rows
}

export async function findExpenseById(id: string, organizationId: string): Promise<Expense | null> {
  const result = await db.query<Expense>(
    `SELECT * FROM expense WHERE id = $1 AND organization_id = $2`,
    [id, organizationId]
  )
  return result.rows[0] ?? null
}

export async function createExpense(organizationId: string, input: CreateExpenseInput): Promise<Expense> {
  const result = await db.query<Expense>(
    `INSERT INTO expense (organization_id, project_id, category, description, amount, currency, date)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [organizationId, input.project_id ?? null, input.category, input.description, input.amount, input.currency, input.date]
  )
  return result.rows[0]
}

export async function updateExpense(id: string, organizationId: string, input: UpdateExpenseInput): Promise<Expense | null> {
  const result = await db.query<Expense>(
    `UPDATE expense
     SET category    = COALESCE($3, category),
         description = COALESCE($4, description),
         amount      = COALESCE($5, amount),
         currency    = COALESCE($6, currency),
         date        = COALESCE($7, date),
         project_id  = CASE WHEN $8::boolean THEN $9 ELSE project_id END
     WHERE id = $1 AND organization_id = $2
     RETURNING *`,
    [
      id, organizationId,
      input.category    ?? null,
      input.description ?? null,
      input.amount      ?? null,
      input.currency    ?? null,
      input.date        ?? null,
      'project_id' in input, input.project_id ?? null,
    ]
  )
  return result.rows[0] ?? null
}

export async function deleteExpense(id: string, organizationId: string): Promise<boolean> {
  const result = await db.query(`DELETE FROM expense WHERE id = $1 AND organization_id = $2`, [id, organizationId])
  return (result.rowCount ?? 0) > 0
}
