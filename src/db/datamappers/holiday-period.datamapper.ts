import { db } from '@/lib/db'
import type { ScheduleOwner, SchoolHolidayPeriod } from '@/features/schedule/schedule.types'
import type { CreateHolidayInput, UpdateHolidayInput } from '@/features/schedule/schedule.schema'

export async function findHolidayPeriods(owner: ScheduleOwner): Promise<SchoolHolidayPeriod[]> {
  const result = await db.query<SchoolHolidayPeriod>(
    `SELECT * FROM school_holiday_period
     WHERE organization_id = $1 AND user_id = $2
     ORDER BY start_date`,
    [owner.organizationId, owner.userId]
  )
  return result.rows
}

export async function createHolidayPeriod(owner: ScheduleOwner, input: CreateHolidayInput): Promise<SchoolHolidayPeriod> {
  const result = await db.query<SchoolHolidayPeriod>(
    `INSERT INTO school_holiday_period (organization_id, user_id, label, start_date, end_date)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [owner.organizationId, owner.userId, input.label, input.start_date, input.end_date]
  )
  return result.rows[0]
}

export async function updateHolidayPeriod(
  id: string,
  owner: ScheduleOwner,
  input: UpdateHolidayInput
): Promise<SchoolHolidayPeriod | null> {
  const result = await db.query<SchoolHolidayPeriod>(
    `UPDATE school_holiday_period
     SET label      = COALESCE($4, label),
         start_date = COALESCE($5, start_date),
         end_date   = COALESCE($6, end_date)
     WHERE id = $1 AND organization_id = $2 AND user_id = $3
     RETURNING *`,
    [id, owner.organizationId, owner.userId, input.label ?? null, input.start_date ?? null, input.end_date ?? null]
  )
  return result.rows[0] ?? null
}

export async function deleteHolidayPeriod(id: string, owner: ScheduleOwner): Promise<boolean> {
  const result = await db.query(
    `DELETE FROM school_holiday_period WHERE id = $1 AND organization_id = $2 AND user_id = $3`,
    [id, owner.organizationId, owner.userId]
  )
  return (result.rowCount ?? 0) > 0
}
