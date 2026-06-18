import { z } from 'zod'

const personaTextField = z.string().nullish()

export const createPersonaSchema = z.object({
  name:                     z.string().min(1).max(255),
  demo_first_name:          z.string().max(100).optional(),
  demo_last_name:           z.string().max(100).optional(),
  demo_age:                 z.string().max(50).optional(),
  demo_marital_status:      z.string().max(100).optional(),
  demo_job_title:           z.string().max(150).optional(),
  demo_professional_status: z.string().max(100).optional(),
  demo_income:              z.string().max(100).optional(),
  interests:                z.string().optional(),
  general_description:      z.string().optional(),
  drivers:                  z.string().optional(),
  vital_needs:              z.string().optional(),
  purchase_motivations:     z.string().optional(),
  purchase_barriers:        z.string().optional(),
  offer_discovery:          z.string().optional(),
  path_to_goal:             z.string().optional(),
})

export const updatePersonaSchema = z.object({
  name:                     z.string().min(1).max(255).optional(),
  demo_first_name:          personaTextField,
  demo_last_name:           personaTextField,
  demo_age:                 personaTextField,
  demo_marital_status:      personaTextField,
  demo_job_title:           personaTextField,
  demo_professional_status: personaTextField,
  demo_income:              personaTextField,
  interests:                personaTextField,
  general_description:      personaTextField,
  drivers:                  personaTextField,
  vital_needs:              personaTextField,
  purchase_motivations:     personaTextField,
  purchase_barriers:        personaTextField,
  offer_discovery:          personaTextField,
  path_to_goal:             personaTextField,
})

export const personaParamsSchema = z.object({ id: z.string().uuid() })

export type CreatePersonaInput = z.infer<typeof createPersonaSchema>
export type UpdatePersonaInput = z.infer<typeof updatePersonaSchema>
