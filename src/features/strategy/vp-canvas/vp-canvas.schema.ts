import { z } from 'zod'

const block = z.string().nullish()

export const createVpCanvasSchema = z.object({
  name:              z.string().min(1).max(255),
  offer_id:          z.string().uuid().nullish(),
  persona_id:        z.string().uuid().nullish(),
  customer_jobs:     block,
  customer_pains:    block,
  customer_gains:    block,
  products_services: block,
  pain_relievers:    block,
  gain_creators:     block,
})

export const updateVpCanvasSchema = z.object({
  name:              z.string().min(1).max(255).optional(),
  offer_id:          z.string().uuid().nullish(),
  persona_id:        z.string().uuid().nullish(),
  customer_jobs:     block,
  customer_pains:    block,
  customer_gains:    block,
  products_services: block,
  pain_relievers:    block,
  gain_creators:     block,
})

export const vpCanvasParamsSchema = z.object({ id: z.string().uuid() })

export type CreateVpCanvasInput = z.infer<typeof createVpCanvasSchema>
export type UpdateVpCanvasInput = z.infer<typeof updateVpCanvasSchema>
