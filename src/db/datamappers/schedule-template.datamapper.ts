import { db } from '@/lib/db'
import type { ScheduleOwner, ScheduleTemplateBlock } from '@/features/schedule/schedule.types'
import type { CreateTemplateBlockInput, UpdateTemplateBlockInput } from '@/features/schedule/schedule.schema'

export async function findTemplateBlocks(owner: ScheduleOwner): Promise<ScheduleTemplateBlock[]> {
  const result = await db.query<ScheduleTemplateBlock>(
    `SELECT * FROM schedule_template_block
     WHERE organization_id = $1 AND user_id = $2
     ORDER BY weekday, start_time`,
    [owner.organizationId, owner.userId]
  )
  return result.rows
}

export async function findTemplateBlockById(id: string, owner: ScheduleOwner): Promise<ScheduleTemplateBlock | null> {
  const result = await db.query<ScheduleTemplateBlock>(
    `SELECT * FROM schedule_template_block WHERE id = $1 AND organization_id = $2 AND user_id = $3`,
    [id, owner.organizationId, owner.userId]
  )
  return result.rows[0] ?? null
}

export async function createTemplateBlock(
  owner: ScheduleOwner,
  input: CreateTemplateBlockInput
): Promise<ScheduleTemplateBlock> {
  const result = await db.query<ScheduleTemplateBlock>(
    `INSERT INTO schedule_template_block
       (organization_id, user_id, weekday, start_time, end_time, label, category, project_id, period_rule)
     VALUES ($1, $2, $3, $4, $5, $6, COALESCE($7, 'pro')::schedule_category, $8,
             COALESCE($9, 'always')::schedule_period_rule)
     RETURNING *`,
    [
      owner.organizationId, owner.userId,
      input.weekday, input.start_time, input.end_time, input.label,
      input.category ?? null, input.project_id ?? null, input.period_rule ?? null,
    ]
  )
  return result.rows[0]
}

export async function updateTemplateBlock(
  id: string,
  owner: ScheduleOwner,
  input: UpdateTemplateBlockInput
): Promise<ScheduleTemplateBlock | null> {
  const result = await db.query<ScheduleTemplateBlock>(
    `UPDATE schedule_template_block
     SET weekday     = COALESCE($4, weekday),
         start_time  = COALESCE($5, start_time),
         end_time    = COALESCE($6, end_time),
         label       = COALESCE($7, label),
         category    = COALESCE($8::schedule_category, category),
         period_rule = COALESCE($9::schedule_period_rule, period_rule),
         project_id  = CASE WHEN $10::boolean THEN $11 ELSE project_id END
     WHERE id = $1 AND organization_id = $2 AND user_id = $3
     RETURNING *`,
    [
      id, owner.organizationId, owner.userId,
      input.weekday ?? null, input.start_time ?? null, input.end_time ?? null, input.label ?? null,
      input.category ?? null, input.period_rule ?? null,
      'project_id' in input, input.project_id ?? null,
    ]
  )
  return result.rows[0] ?? null
}

/** Les semaines déjà créées gardent leur copie : `schedule_block.template_block_id` passe à NULL. */
export async function deleteTemplateBlock(id: string, owner: ScheduleOwner): Promise<boolean> {
  const result = await db.query(
    `DELETE FROM schedule_template_block WHERE id = $1 AND organization_id = $2 AND user_id = $3`,
    [id, owner.organizationId, owner.userId]
  )
  return (result.rowCount ?? 0) > 0
}
