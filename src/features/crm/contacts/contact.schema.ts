import { z } from 'zod'

const CONTACT_STATUSES = ['lead', 'prospect', 'client', 'former_client', 'partner', 'other'] as const

export const createContactSchema = z.object({
  first_name: z.string().min(1).max(100),
  last_name:  z.string().min(1).max(100),
  email:      z.string().email().max(255).optional(),
  phone:      z.string().max(30).optional(),
  company_id: z.string().uuid().optional(),
  status:     z.enum(CONTACT_STATUSES).default('lead'),
  notes:      z.string().optional(),
})

export const updateContactSchema = z.object({
  first_name: z.string().min(1).max(100).optional(),
  last_name:  z.string().min(1).max(100).optional(),
  email:      z.string().email().max(255).nullish(),
  phone:      z.string().max(30).nullish(),
  company_id: z.string().uuid().nullish(),
  status:     z.enum(CONTACT_STATUSES).optional(),
  notes:      z.string().nullish(),
})

export const contactParamsSchema = z.object({
  id: z.string().uuid(),
})

export const contactQuerySchema = z.object({
  search:     z.string().optional(),
  status:     z.enum(CONTACT_STATUSES).optional(),
  company_id: z.string().uuid().optional(),
})

export type CreateContactInput = z.infer<typeof createContactSchema>
export type UpdateContactInput = z.infer<typeof updateContactSchema>
export type ContactQuery       = z.infer<typeof contactQuerySchema>
