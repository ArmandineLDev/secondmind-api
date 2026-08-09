import { z } from 'zod'

const PROJECT_STATUS = ['not_started', 'in_progress', 'on_hold', 'completed', 'cancelled'] as const

export const createProjectSchema = z.object({
  name:        z.string().min(1).max(100),
  description: z.string().max(2000).nullish(),
  status:      z.enum(PROJECT_STATUS).optional(),
  company_id:  z.string().uuid().nullable().optional(),
  contact_id:  z.string().uuid().nullable().optional(),
  start_date:  z.string().date().nullish(),
  end_date:    z.string().date().nullish(),
})

export const updateProjectSchema = z.object({
  name:        z.string().min(1).max(100).optional(),
  description: z.string().max(2000).nullable().optional(),
  status:      z.enum(PROJECT_STATUS).optional(),
  company_id:  z.string().uuid().nullable().optional(),
  contact_id:  z.string().uuid().nullable().optional(),
  start_date:  z.string().date().nullable().optional(),
  end_date:    z.string().date().nullable().optional(),
})

export const projectParamsSchema = z.object({
  id: z.string().uuid(),
})

export const listProjectsQuerySchema = z.object({
  archived: z.coerce.boolean().optional().default(false),
})

export type CreateProjectInput = z.infer<typeof createProjectSchema>
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>
