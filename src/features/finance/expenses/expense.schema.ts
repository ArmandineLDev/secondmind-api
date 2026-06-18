import { z } from 'zod'

const EXPENSE_CATEGORIES = ['subscription', 'equipment', 'training', 'travel', 'other'] as const

export const createExpenseSchema = z.object({
  category:    z.enum(EXPENSE_CATEGORIES),
  description: z.string().min(1),
  amount:      z.number().positive(),
  date:        z.string().date(),
  project_id:  z.string().uuid().optional(),
  currency:    z.string().length(3).default('EUR'),
})

export const updateExpenseSchema = z.object({
  category:    z.enum(EXPENSE_CATEGORIES).optional(),
  description: z.string().min(1).optional(),
  amount:      z.number().positive().optional(),
  date:        z.string().date().optional(),
  project_id:  z.string().uuid().nullish(),
  currency:    z.string().length(3).optional(),
})

export const expenseParamsSchema = z.object({ id: z.string().uuid() })

export const expenseQuerySchema = z.object({
  project_id: z.string().uuid().optional(),
  category:   z.enum(EXPENSE_CATEGORIES).optional(),
  year:       z.coerce.number().int().optional(),
})

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>
export type ExpenseQuery       = z.infer<typeof expenseQuerySchema>
