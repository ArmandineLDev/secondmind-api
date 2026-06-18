import { db } from '@/lib/db'
import type { Budget } from '@/features/finance/budgets/budget.types'
import type { UpsertBudgetInput } from '@/features/finance/budgets/budget.schema'

export async function findBudgetByProject(projectId: string): Promise<Budget | null> {
  const result = await db.query<Budget>(
    `SELECT * FROM budget WHERE project_id = $1`,
    [projectId]
  )
  return result.rows[0] ?? null
}

export async function upsertBudget(projectId: string, input: UpsertBudgetInput): Promise<Budget> {
  const result = await db.query<Budget>(
    `INSERT INTO budget (project_id, planned_amount, currency)
     VALUES ($1, $2, $3)
     ON CONFLICT (project_id) DO UPDATE
       SET planned_amount = EXCLUDED.planned_amount,
           currency       = EXCLUDED.currency,
           updated_at     = now()
     RETURNING *`,
    [projectId, input.planned_amount, input.currency]
  )
  return result.rows[0]
}

export async function deleteBudget(projectId: string): Promise<boolean> {
  const result = await db.query(`DELETE FROM budget WHERE project_id = $1`, [projectId])
  return (result.rowCount ?? 0) > 0
}
