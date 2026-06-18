import { z } from 'zod'

export const createTimeEntrySchema = z.object({
  duration_minutes: z.number().int().positive(),
  date:             z.string().date(),
  project_id:       z.string().uuid().optional(),
  task_id:          z.string().uuid().optional(),
  hourly_rate:      z.number().positive().optional(),
  description:      z.string().optional(),
})

export const updateTimeEntrySchema = z.object({
  duration_minutes: z.number().int().positive().optional(),
  date:             z.string().date().optional(),
  project_id:       z.string().uuid().nullish(),
  task_id:          z.string().uuid().nullish(),
  hourly_rate:      z.number().positive().nullish(),
  description:      z.string().nullish(),
})

export const timeEntryParamsSchema = z.object({ id: z.string().uuid() })

export const timeEntryQuerySchema = z.object({
  project_id: z.string().uuid().optional(),
  task_id:    z.string().uuid().optional(),
  year:       z.coerce.number().int().optional(),
  month:      z.coerce.number().int().min(1).max(12).optional(),
})

export type CreateTimeEntryInput = z.infer<typeof createTimeEntrySchema>
export type UpdateTimeEntryInput = z.infer<typeof updateTimeEntrySchema>
export type TimeEntryQuery       = z.infer<typeof timeEntryQuerySchema>
