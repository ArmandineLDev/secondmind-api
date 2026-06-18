import { z } from 'zod'

const BILLING_TYPES = ['fixed', 'hourly', 'monthly', 'custom'] as const

export const createOfferSchema = z.object({
  name:         z.string().min(1).max(255),
  description:  z.string().optional(),
  price:        z.number().positive().optional(),
  currency:     z.string().length(3).default('EUR'),
  billing_type: z.enum(BILLING_TYPES),
  is_active:    z.boolean().default(true),
})

export const updateOfferSchema = z.object({
  name:         z.string().min(1).max(255).optional(),
  description:  z.string().nullish(),
  price:        z.number().positive().nullish(),
  currency:     z.string().length(3).optional(),
  billing_type: z.enum(BILLING_TYPES).optional(),
  is_active:    z.boolean().optional(),
})

export const offerParamsSchema = z.object({ id: z.string().uuid() })

export const offerQuerySchema = z.object({
  is_active: z.enum(['true', 'false']).optional(),
})

export type CreateOfferInput = z.infer<typeof createOfferSchema>
export type UpdateOfferInput = z.infer<typeof updateOfferSchema>
export type OfferQuery       = z.infer<typeof offerQuerySchema>
