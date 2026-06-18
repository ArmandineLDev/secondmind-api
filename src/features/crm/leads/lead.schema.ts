import { z } from 'zod'

const LEAD_STAGES = ['prospect', 'qualification', 'proposal', 'negotiation', 'won', 'lost'] as const

export const createLeadSchema = z.object({
  title:       z.string().min(1).max(255),
  contact_id:  z.string().uuid().optional(),
  company_id:  z.string().uuid().optional(),
  value:       z.number().positive().optional(),
  stage:       z.enum(LEAD_STAGES).default('prospect'),
  probability: z.number().int().min(0).max(100).optional(),
  notes:       z.string().optional(),
  closed_at:   z.string().date().optional(),
})

export const updateLeadSchema = z.object({
  title:       z.string().min(1).max(255).optional(),
  contact_id:  z.string().uuid().nullish(),
  company_id:  z.string().uuid().nullish(),
  value:       z.number().positive().nullish(),
  stage:       z.enum(LEAD_STAGES).optional(),
  probability: z.number().int().min(0).max(100).nullish(),
  notes:       z.string().nullish(),
  closed_at:   z.string().date().nullish(),
})

export const leadParamsSchema = z.object({
  id: z.string().uuid(),
})

export const leadQuerySchema = z.object({
  stage:      z.enum(LEAD_STAGES).optional(),
  contact_id: z.string().uuid().optional(),
  company_id: z.string().uuid().optional(),
})

export type CreateLeadInput = z.infer<typeof createLeadSchema>
export type UpdateLeadInput = z.infer<typeof updateLeadSchema>
export type LeadQuery       = z.infer<typeof leadQuerySchema>
