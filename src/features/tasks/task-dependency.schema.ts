import { z } from 'zod'

export const addDependencySchema = z.object({
  depends_on_id: z.string().uuid(),
})

export const dependencyParamsSchema = z.object({
  id:           z.string().uuid(),
  taskId:       z.string().uuid(),
  dependsOnId:  z.string().uuid(),
})

export type AddDependencyInput = z.infer<typeof addDependencySchema>
