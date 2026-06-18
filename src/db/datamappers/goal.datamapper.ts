import { db } from '@/lib/db'
import type { Goal } from '@/features/marketing/goals/goal.types'
import type { CreateGoalInput, UpdateGoalInput, GoalQuery } from '@/features/marketing/goals/goal.schema'

export async function findAllGoals(
  organizationId: string,
  query: GoalQuery
): Promise<Goal[]> {
  const conditions: string[] = ['organization_id = $1']
  const params: unknown[] = [organizationId]
  let i = 2

  if (query.category) {
    conditions.push(`category = $${i++}`)
    params.push(query.category)
  }
  if (query.status) {
    conditions.push(`status = $${i++}`)
    params.push(query.status)
  }

  const result = await db.query<Goal>(
    `SELECT * FROM goal
     WHERE ${conditions.join(' AND ')}
     ORDER BY due_date ASC NULLS LAST, created_at DESC`,
    params
  )
  return result.rows
}

export async function findGoalById(
  id: string,
  organizationId: string
): Promise<Goal | null> {
  const result = await db.query<Goal>(
    `SELECT * FROM goal WHERE id = $1 AND organization_id = $2`,
    [id, organizationId]
  )
  return result.rows[0] ?? null
}

export async function createGoal(
  organizationId: string,
  input: CreateGoalInput
): Promise<Goal> {
  const result = await db.query<Goal>(
    `INSERT INTO goal (organization_id, title, description, category, target_value, current_value, unit, due_date, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
    [
      organizationId,
      input.title,
      input.description   ?? null,
      input.category,
      input.target_value  ?? null,
      input.current_value ?? null,
      input.unit          ?? null,
      input.due_date      ?? null,
      input.status,
    ]
  )
  return result.rows[0]
}

export async function updateGoal(
  id: string,
  organizationId: string,
  input: UpdateGoalInput
): Promise<Goal | null> {
  const result = await db.query<Goal>(
    `UPDATE goal
     SET title         = COALESCE($3, title),
         category      = COALESCE($4, category),
         status        = COALESCE($5, status),
         description   = CASE WHEN $6::boolean  THEN $7  ELSE description   END,
         target_value  = CASE WHEN $8::boolean  THEN $9  ELSE target_value  END,
         current_value = CASE WHEN $10::boolean THEN $11 ELSE current_value END,
         unit          = CASE WHEN $12::boolean THEN $13 ELSE unit          END,
         due_date      = CASE WHEN $14::boolean THEN $15 ELSE due_date      END
     WHERE id = $1 AND organization_id = $2
     RETURNING *`,
    [
      id,
      organizationId,
      input.title    ?? null,
      input.category ?? null,
      input.status   ?? null,
      'description'   in input, input.description   ?? null,
      'target_value'  in input, input.target_value  ?? null,
      'current_value' in input, input.current_value ?? null,
      'unit'          in input, input.unit          ?? null,
      'due_date'      in input, input.due_date      ?? null,
    ]
  )
  return result.rows[0] ?? null
}

export async function deleteGoal(id: string, organizationId: string): Promise<boolean> {
  const result = await db.query(
    `DELETE FROM goal WHERE id = $1 AND organization_id = $2`,
    [id, organizationId]
  )
  return (result.rowCount ?? 0) > 0
}
