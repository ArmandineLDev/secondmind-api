import { z } from 'zod'

const OPPORTUNITY_STAGES = ['prospect', 'qualification', 'proposal', 'negotiation', 'won', 'lost'] as const

// `nullish()` partout sur les champs facultatifs : le formulaire envoie `null`
// pour un champ vidé (et non `undefined`), sans quoi la clé disparaîtrait du
// payload et la valeur ne serait jamais effacée en base.
export const createOpportunitySchema = z.object({
  title:       z.string().min(1).max(255),
  contact_id:  z.string().uuid().nullish(),
  company_id:  z.string().uuid().nullish(),
  offer_id:    z.string().uuid().nullish(),
  value:       z.number().positive().nullish(),
  stage:       z.enum(OPPORTUNITY_STAGES).default('prospect'),
  probability: z.number().int().min(0).max(100).nullish(),
  notes:       z.string().nullish(),
  closed_at:   z.string().date().nullish(),
})

export const updateOpportunitySchema = z.object({
  title:       z.string().min(1).max(255).optional(),
  contact_id:  z.string().uuid().nullish(),
  company_id:  z.string().uuid().nullish(),
  offer_id:    z.string().uuid().nullish(),
  value:       z.number().positive().nullish(),
  stage:       z.enum(OPPORTUNITY_STAGES).optional(),
  probability: z.number().int().min(0).max(100).nullish(),
  notes:       z.string().nullish(),
  closed_at:   z.string().date().nullish(),
})

export const opportunityParamsSchema = z.object({
  id: z.string().uuid(),
})

export const opportunityQuerySchema = z.object({
  stage:      z.enum(OPPORTUNITY_STAGES).optional(),
  contact_id: z.string().uuid().optional(),
  company_id: z.string().uuid().optional(),
  offer_id:   z.string().uuid().optional(),
})

export type CreateOpportunityInput = z.infer<typeof createOpportunitySchema>
export type UpdateOpportunityInput = z.infer<typeof updateOpportunitySchema>
export type OpportunityQuery       = z.infer<typeof opportunityQuerySchema>
