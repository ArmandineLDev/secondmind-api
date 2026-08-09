import type { FastifyRequest, FastifyReply } from 'fastify'
import { auth } from '@/lib/auth'
import { signupSchema } from './signup.schema'
import { signup as signupService, SignupError } from './signup.service'

// Lu depuis la configuration plutôt que recopié : les deux ne doivent pas
// pouvoir diverger. Un front affichant « confirmez votre adresse » alors que la
// connexion est ouverte enverrait l'utilisateur attendre un email inutile.
const EMAIL_VERIFICATION_REQUIRED =
  auth.options.emailAndPassword?.requireEmailVerification ?? false

export async function signup(request: FastifyRequest, reply: FastifyReply) {
  const input = signupSchema.parse(request.body)

  try {
    const { organizationId } = await signupService(input)

    // 201 sans session : l'inscription ne connecte pas.
    // `emailVerificationRequired` reflète le réglage réel de `lib/auth.ts` —
    // le front s'en sert pour choisir entre l'écran de confirmation et une
    // invitation à se connecter directement.
    return reply.status(201).send({
      organizationId,
      emailVerificationRequired: EMAIL_VERIFICATION_REQUIRED,
    })
  } catch (error) {
    if (error instanceof SignupError) {
      return reply.status(error.status).send({ error: error.message, status: error.status })
    }
    throw error
  }
}
