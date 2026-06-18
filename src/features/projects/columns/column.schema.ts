import { z } from 'zod'

export const createColumnSchema = z.object({
  name: z.string().min(1).max(100),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
})

export const updateColumnSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).nullable().optional(),
})

export const reorderColumnsSchema = z.object({
  order: z.array(z.string().uuid()).min(1),
})

export const columnParamsSchema = z.object({
  id: z.string().uuid(),
  colId: z.string().uuid(),
})

export type CreateColumnInput = z.infer<typeof createColumnSchema>
export type UpdateColumnInput = z.infer<typeof updateColumnSchema>
export type ReorderColumnsInput = z.infer<typeof reorderColumnsSchema>
