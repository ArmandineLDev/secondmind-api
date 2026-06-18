import { z } from 'zod'

export const upsertBudgetSchema = z.object({
  planned_amount: z.number().positive(),
  currency:       z.string().length(3).default('EUR'),
})

export const budgetParamsSchema = z.object({
  projectId: z.string().uuid(),
})

export type UpsertBudgetInput = z.infer<typeof upsertBudgetSchema>
