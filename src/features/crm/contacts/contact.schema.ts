import { z } from 'zod'
import { emailSchema } from '@/lib/email.schema'

const CONTACT_STATUSES = ['lead', 'prospect', 'client', 'former_client', 'partner', 'other'] as const
const CONTACT_SOURCE_CHANNELS = ['email', 'phone', 'social_media', 'referral', 'event', 'other'] as const

export const createContactSchema = z.object({
  first_name:        z.string().min(1).max(100),
  last_name:         z.string().min(1).max(100),
  email:             emailSchema.optional(),
  phone:             z.string().max(30).optional(),
  company_id:        z.string().uuid().optional(),
  status:            z.enum(CONTACT_STATUSES).default('lead'),
  source_channel:    z.enum(CONTACT_SOURCE_CHANNELS).optional(),
  source_detail:     z.string().optional(),
  next_follow_up_at: z.string().date().nullish(),
  follow_up_note:    z.string().optional(),
  notes:             z.string().optional(),
})

export const updateContactSchema = z.object({
  first_name:        z.string().min(1).max(100).optional(),
  last_name:         z.string().min(1).max(100).optional(),
  email:             emailSchema.nullish(),
  phone:             z.string().max(30).nullish(),
  company_id:        z.string().uuid().nullish(),
  status:            z.enum(CONTACT_STATUSES).optional(),
  source_channel:    z.enum(CONTACT_SOURCE_CHANNELS).nullish(),
  source_detail:     z.string().nullish(),
  next_follow_up_at: z.string().date().nullish(),
  follow_up_note:    z.string().nullish(),
  notes:             z.string().nullish(),
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
