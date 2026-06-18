import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(1974),
  HOST: z.string().default('0.0.0.0'),
  DATABASE_URL: z.url(),
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.url(),
  CORS_ORIGIN: z.url(),
  DB_POOL_MAX: z.coerce.number().default(10),

  // Brevo
  BREVO_API_KEY: z.string().min(1),
  BREVO_SENDER_EMAIL: z.string().email(),
  BREVO_SENDER_NAME: z.string().min(1),

  // Scaleway Object Storage
  SCALEWAY_ACCESS_KEY: z.string().min(1),
  SCALEWAY_SECRET_KEY: z.string().min(1),
  SCALEWAY_BUCKET:     z.string().min(1),
  SCALEWAY_ENDPOINT:   z.url(),
  SCALEWAY_REGION:     z.string().default('fr-par'),
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  console.error('❌ Variables d\'environnement invalides :')
  console.error(parsed.error.flatten().fieldErrors)
  process.exit(1)
}

export const env = parsed.data
