import { z } from 'zod'

const block = z.string().nullish()

export const createSwotSchema = z.object({
  name:          z.string().min(1).max(255),
  strengths:     block,
  weaknesses:    block,
  opportunities: block,
  threats:       block,
})

export const updateSwotSchema = z.object({
  name:          z.string().min(1).max(255).optional(),
  strengths:     block,
  weaknesses:    block,
  opportunities: block,
  threats:       block,
})

export const swotParamsSchema = z.object({ id: z.string().uuid() })

export type CreateSwotInput = z.infer<typeof createSwotSchema>
export type UpdateSwotInput = z.infer<typeof updateSwotSchema>
