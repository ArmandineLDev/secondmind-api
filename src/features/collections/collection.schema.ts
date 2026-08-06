import { z } from 'zod'

export const createCollectionSchema = z.object({
  name:       z.string().min(1).max(255),
  icon:       z.string().max(50).nullish(),
  project_id: z.string().uuid().nullish(),
})

export const updateCollectionSchema = z.object({
  name:       z.string().min(1).max(255).optional(),
  icon:       z.string().max(50).nullish(),
  project_id: z.string().uuid().nullish(),
})

export const collectionParamsSchema = z.object({ id: z.string().uuid() })

export const collectionQuerySchema = z.object({
  project_id: z.string().uuid().optional(),
})

export type CreateCollectionInput = z.infer<typeof createCollectionSchema>
export type UpdateCollectionInput = z.infer<typeof updateCollectionSchema>
export type CollectionQuery       = z.infer<typeof collectionQuerySchema>
