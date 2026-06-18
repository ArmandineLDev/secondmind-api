import { z } from 'zod'

const INTERACTION_TYPES = ['email', 'call', 'meeting', 'other'] as const

export const createInteractionSchema = z.object({
  type:    z.enum(INTERACTION_TYPES),
  date:    z.string().date(),
  lead_id: z.string().uuid().optional(),
  notes:   z.string().optional(),
})

export const updateInteractionSchema = z.object({
  type:    z.enum(INTERACTION_TYPES).optional(),
  date:    z.string().date().optional(),
  lead_id: z.string().uuid().nullish(),
  notes:   z.string().nullish(),
})

export const interactionParamsSchema = z.object({
  contactId: z.string().uuid(),
  id:        z.string().uuid(),
})

export type CreateInteractionInput = z.infer<typeof createInteractionSchema>
export type UpdateInteractionInput = z.infer<typeof updateInteractionSchema>
