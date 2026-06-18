import { z } from 'zod'

const block = z.string().nullish()

export const createCanvasSchema = z.object({
  name:                   z.string().min(1).max(255),
  customer_segments:      z.string().optional(),
  value_propositions:     z.string().optional(),
  channels:               z.string().optional(),
  customer_relationships: z.string().optional(),
  revenue_streams:        z.string().optional(),
  key_resources:          z.string().optional(),
  key_activities:         z.string().optional(),
  key_partners:           z.string().optional(),
  cost_structure:         z.string().optional(),
})

export const updateCanvasSchema = z.object({
  name:                   z.string().min(1).max(255).optional(),
  customer_segments:      block,
  value_propositions:     block,
  channels:               block,
  customer_relationships: block,
  revenue_streams:        block,
  key_resources:          block,
  key_activities:         block,
  key_partners:           block,
  cost_structure:         block,
})

export const canvasParamsSchema = z.object({ id: z.string().uuid() })

export type CreateCanvasInput = z.infer<typeof createCanvasSchema>
export type UpdateCanvasInput = z.infer<typeof updateCanvasSchema>
