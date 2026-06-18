import { z } from 'zod'

export const createCompanySchema = z.object({
  name:     z.string().min(1).max(255),
  website:  z.string().url().max(255).optional(),
  industry: z.string().max(100).optional(),
  notes:    z.string().optional(),
})

export const updateCompanySchema = z.object({
  name:     z.string().min(1).max(255).optional(),
  website:  z.string().url().max(255).nullish(),
  industry: z.string().max(100).nullish(),
  notes:    z.string().nullish(),
})

export const companyParamsSchema = z.object({
  id: z.string().uuid(),
})

export type CreateCompanyInput = z.infer<typeof createCompanySchema>
export type UpdateCompanyInput = z.infer<typeof updateCompanySchema>
