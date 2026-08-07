import { z } from 'zod'

// `data` est un objet libre : les clés sont des ids de champ, les valeurs
// dépendent du type de chaque champ. La cohérence type ↔ valeur est vérifiée
// dans le service, qui seul connaît la définition des colonnes.
const dataSchema = z.record(z.string(), z.unknown())

export const createItemSchema = z.object({
  data: dataSchema.optional(),
})

export const updateItemSchema = z.object({
  data: dataSchema,
})

export const itemParamsSchema = z.object({
  id:     z.string().uuid(),
  itemId: z.string().uuid(),
})

export type CreateItemInput = z.infer<typeof createItemSchema>
export type UpdateItemInput = z.infer<typeof updateItemSchema>
