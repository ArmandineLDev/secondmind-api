import { z } from 'zod'
import { emailSchema } from '@/lib/email.schema'

export const preferencesSchema = z.object({
  default_currency:   z.string().length(3).optional(),
  // Coerce : le formulaire web envoie ces nombres sous forme de chaîne (input HTML).
  default_daily_rate: z.coerce.number().positive().nullable().optional(),
  hours_per_day:      z.coerce.number().positive().max(24).optional(),
})

export const addClientSchema = z.object({
  email: emailSchema,
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
