import { z } from 'zod'

const DOCUMENT_TYPES = ['spec', 'contract', 'invoice', 'other'] as const

export const documentMetaSchema = z.object({
  name:       z.string().min(1).max(255),
  type:       z.enum(DOCUMENT_TYPES),
  project_id: z.string().uuid().optional(),
  client_id:  z.string().optional(),
})

export const documentParamsSchema = z.object({ id: z.string().uuid() })

export const documentQuerySchema = z.object({
  type:       z.enum(DOCUMENT_TYPES).optional(),
  project_id: z.string().uuid().optional(),
  client_id:  z.string().optional(),
})

export type DocumentMeta  = z.infer<typeof documentMetaSchema>
export type DocumentQuery = z.infer<typeof documentQuerySchema>
