import { z } from 'zod'

export const createRevenueSchema = z.object({
  amount:      z.number().positive(),
  date:        z.string().date(),
  description: z.string().optional(),
  project_id:  z.string().uuid().optional(),
  contact_id:  z.string().uuid().optional(),
  currency:    z.string().length(3).default('EUR'),
})

export const updateRevenueSchema = z.object({
  amount:      z.number().positive().optional(),
  date:        z.string().date().optional(),
  description: z.string().nullish(),
  project_id:  z.string().uuid().nullish(),
  contact_id:  z.string().uuid().nullish(),
  currency:    z.string().length(3).optional(),
})

export const revenueParamsSchema  = z.object({ id: z.string().uuid() })

export const revenueQuerySchema = z.object({
  project_id: z.string().uuid().optional(),
  year:       z.coerce.number().int().optional(),
  month:      z.coerce.number().int().min(1).max(12).optional(),
})

export type CreateRevenueInput = z.infer<typeof createRevenueSchema>
export type UpdateRevenueInput = z.infer<typeof updateRevenueSchema>
export type RevenueQuery       = z.infer<typeof revenueQuerySchema>
