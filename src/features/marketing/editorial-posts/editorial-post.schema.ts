import { z } from 'zod'

const POST_NETWORKS  = ['linkedin', 'instagram', 'facebook', 'twitter', 'tiktok', 'other'] as const
const POST_STATUSES  = ['idea', 'draft', 'scheduled', 'published'] as const

export const createPostSchema = z.object({
  network:      z.enum(POST_NETWORKS),
  status:       z.enum(POST_STATUSES).default('idea'),
  title:        z.string().max(255).optional(),
  content:      z.string().optional(),
  persona_id:   z.string().uuid().optional(),
  scheduled_at: z.string().datetime().optional(),
  published_at: z.string().datetime().optional(),
  tags:         z.array(z.string()).default([]),
})

export const updatePostSchema = z.object({
  network:      z.enum(POST_NETWORKS).optional(),
  status:       z.enum(POST_STATUSES).optional(),
  title:        z.string().max(255).nullish(),
  content:      z.string().nullish(),
  persona_id:   z.string().uuid().nullish(),
  scheduled_at: z.string().datetime().nullish(),
  published_at: z.string().datetime().nullish(),
  tags:         z.array(z.string()).optional(),
})

export const postParamsSchema = z.object({ id: z.string().uuid() })

export const postQuerySchema = z.object({
  network:  z.enum(POST_NETWORKS).optional(),
  status:   z.enum(POST_STATUSES).optional(),
  year:     z.coerce.number().int().optional(),
  month:    z.coerce.number().int().min(1).max(12).optional(),
})

export type CreatePostInput = z.infer<typeof createPostSchema>
export type UpdatePostInput = z.infer<typeof updatePostSchema>
export type PostQuery       = z.infer<typeof postQuerySchema>
