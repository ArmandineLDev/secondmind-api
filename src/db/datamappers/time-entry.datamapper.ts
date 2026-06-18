import { db } from '@/lib/db'
import type { TimeEntry } from '@/features/finance/time-entries/time-entry.types'
import type { CreateTimeEntryInput, UpdateTimeEntryInput, TimeEntryQuery } from '@/features/finance/time-entries/time-entry.schema'

export async function findAllTimeEntries(organizationId: string, query: TimeEntryQuery): Promise<TimeEntry[]> {
  const conditions: string[] = ['organization_id = $1']
  const params: unknown[] = [organizationId]
  let i = 2

  if (query.project_id) { conditions.push(`project_id = $${i++}`); params.push(query.project_id) }
  if (query.task_id)    { conditions.push(`task_id = $${i++}`);    params.push(query.task_id) }
  if (query.year)       { conditions.push(`EXTRACT(YEAR  FROM date) = $${i++}`); params.push(query.year) }
  if (query.month)      { conditions.push(`EXTRACT(MONTH FROM date) = $${i++}`); params.push(query.month) }

  const result = await db.query<TimeEntry>(
    `SELECT * FROM time_entry WHERE ${conditions.join(' AND ')} ORDER BY date DESC`,
    params
  )
  return result.rows
}

export async function findTimeEntryById(id: string, organizationId: string): Promise<TimeEntry | null> {
  const result = await db.query<TimeEntry>(
    `SELECT * FROM time_entry WHERE id = $1 AND organization_id = $2`,
    [id, organizationId]
  )
  return result.rows[0] ?? null
}

export async function createTimeEntry(organizationId: string, input: CreateTimeEntryInput): Promise<TimeEntry> {
  const result = await db.query<TimeEntry>(
    `INSERT INTO time_entry (organization_id, project_id, task_id, duration_minutes, hourly_rate, date, description)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [organizationId, input.project_id ?? null, input.task_id ?? null, input.duration_minutes, input.hourly_rate ?? null, input.date, input.description ?? null]
  )
  return result.rows[0]
}

export async function updateTimeEntry(id: string, organizationId: string, input: UpdateTimeEntryInput): Promise<TimeEntry | null> {
  const result = await db.query<TimeEntry>(
    `UPDATE time_entry
     SET duration_minutes = COALESCE($3, duration_minutes),
         date             = COALESCE($4, date),
         project_id       = CASE WHEN $5::boolean THEN $6  ELSE project_id   END,
         task_id          = CASE WHEN $7::boolean THEN $8  ELSE task_id      END,
         hourly_rate      = CASE WHEN $9::boolean THEN $10 ELSE hourly_rate  END,
         description      = CASE WHEN $11::boolean THEN $12 ELSE description  END
     WHERE id = $1 AND organization_id = $2
     RETURNING *`,
    [
      id, organizationId,
      input.duration_minutes ?? null,
      input.date             ?? null,
      'project_id'  in input, input.project_id  ?? null,
      'task_id'     in input, input.task_id     ?? null,
      'hourly_rate' in input, input.hourly_rate ?? null,
      'description' in input, input.description ?? null,
    ]
  )
  return result.rows[0] ?? null
}

export async function deleteTimeEntry(id: string, organizationId: string): Promise<boolean> {
  const result = await db.query(`DELETE FROM time_entry WHERE id = $1 AND organization_id = $2`, [id, organizationId])
  return (result.rowCount ?? 0) > 0
}
