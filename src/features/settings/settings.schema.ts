import { z } from 'zod'

export const preferencesSchema = z.object({
  default_currency:   z.string().length(3).optional(),
  default_daily_rate: z.number().positive().nullable().optional(),
})

export const addClientSchema = z.object({
  email: z.string().email(),
})

export const memberParamsSchema = z.object({
  memberId: z.string().min(1),
})

export const projectAssignSchema = z.object({
  project_id: z.string().uuid(),
})

export const projectAssignParamsSchema = z.object({
  memberId:  z.string().min(1),
  projectId: z.string().uuid(),
})

export type PreferencesInput  = z.infer<typeof preferencesSchema>
export type AddClientInput    = z.infer<typeof addClientSchema>
