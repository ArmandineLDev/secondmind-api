import { z } from 'zod'

const FIELD_TYPES = ['text', 'number', 'select', 'date', 'checkbox', 'url'] as const

// Un `select` sans choix serait inutilisable, et des choix sur un autre type
// n'auraient aucun sens : la règle est portée ici ET par un CHECK en base
// (collection_field_options_only_for_select).
const optionsRule = <T extends z.ZodRawShape>(schema: z.ZodObject<T>) =>
  schema.superRefine((value, ctx) => {
    const v = value as { type?: string; options?: unknown }
    if (v.type === 'select' && (!Array.isArray(v.options) || v.options.length === 0)) {
      ctx.addIssue({
        code: 'custom',
        path: ['options'],
        message: 'Un champ « select » exige au moins un choix',
      })
    }
    if (v.type && v.type !== 'select' && v.options != null) {
      ctx.addIssue({
        code: 'custom',
        path: ['options'],
        message: 'Les choix ne s\'appliquent qu\'à un champ « select »',
      })
    }
  })

export const createFieldSchema = optionsRule(z.object({
  name:     z.string().min(1).max(255),
  type:     z.enum(FIELD_TYPES),
  options:  z.array(z.string().min(1)).nullish(),
  position: z.number().int().min(0).optional(),
}))

export const updateFieldSchema = optionsRule(z.object({
  name:     z.string().min(1).max(255).optional(),
  type:     z.enum(FIELD_TYPES).optional(),
  options:  z.array(z.string().min(1)).nullish(),
  position: z.number().int().min(0).optional(),
}))

export const fieldParamsSchema = z.object({
  id:      z.string().uuid(),
  fieldId: z.string().uuid(),
})

export type CreateFieldInput = z.infer<typeof createFieldSchema>
export type UpdateFieldInput = z.infer<typeof updateFieldSchema>
