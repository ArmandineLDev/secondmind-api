import { z } from 'zod'

const SOCIAL_PLATFORMS = ['instagram', 'facebook', 'linkedin', 'telegram', 'whatsapp', 'other'] as const

export const createSocialLinkSchema = z.object({
  platform: z.enum(SOCIAL_PLATFORMS),
  label:    z.string().max(100).optional(),
  url:      z.string().url().max(2048),
  position: z.number().int().min(0).optional(),
})

export const updateSocialLinkSchema = z.object({
  platform: z.enum(SOCIAL_PLATFORMS).optional(),
  label:    z.string().max(100).nullish(),
  url:      z.string().url().max(2048).optional(),
  position: z.number().int().min(0).optional(),
})

export const socialLinkParamsSchema = z.object({
  contactId: z.string().uuid(),
  id:        z.string().uuid(),
})

export type CreateSocialLinkInput = z.infer<typeof createSocialLinkSchema>
export type UpdateSocialLinkInput = z.infer<typeof updateSocialLinkSchema>
