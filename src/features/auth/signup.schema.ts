import { z } from 'zod'
import { emailSchema } from '@/lib/email.schema'

// Longueur minimale alignée sur `emailAndPassword.minPasswordLength` (lib/auth.ts).
// Les deux doivent bouger ensemble : Better Auth refuserait sinon un mot de passe
// que ce schéma vient d'accepter, et l'erreur remonterait après la validation.
export const MIN_PASSWORD_LENGTH = 10

export const signupSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Le nom est requis.')
    .max(100, 'Le nom ne doit pas dépasser 100 caractères.'),

  email: emailSchema,

  password: z
    .string()
    .min(MIN_PASSWORD_LENGTH, `Le mot de passe doit contenir au moins ${MIN_PASSWORD_LENGTH} caractères.`)
    .max(128, 'Le mot de passe ne doit pas dépasser 128 caractères.'),

  organizationName: z
    .string()
    .trim()
    .min(1, "Le nom de l'espace de travail est requis.")
    .max(100, "Le nom de l'espace de travail ne doit pas dépasser 100 caractères."),
})

export type SignupInput = z.infer<typeof signupSchema>
