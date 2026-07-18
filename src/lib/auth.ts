import { betterAuth } from 'better-auth'
import { organization } from 'better-auth/plugins'
import { APIError } from 'better-auth/api'
import { db } from '@/lib/db'
import { env } from '@/lib/env'
import { sendBrevoEmail, buildResetPasswordEmail } from '@/lib/brevo'
import { findFirstOrganizationIdForUser } from '@/db/datamappers/organization.datamapper'
import { normalizeEmail, ASCII_EMAIL } from '@/lib/email.schema'

// Origine du front : les liens des emails doivent pointer vers l'app, pas vers l'API.
const APP_ORIGIN = env.APP_URL ?? env.CORS_ORIGIN

export const auth = betterAuth({
  appName: 'SecondMind',
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,

  database: db,

  trustedOrigins: [env.CORS_ORIGIN, env.BETTER_AUTH_URL],

  emailAndPassword: {
    enabled: true,
    // Inscription publique fermée : les comptes owner existent déjà et les clients
    // sont ajoutés par invitation (Paramètres → Accès clients), pas en self-service.
    // Ne bloque pas la réinitialisation de mot de passe des comptes existants.
    disableSignUp: true,
    minPasswordLength: 10,
    maxPasswordLength: 128,

    resetPasswordTokenExpiresIn: 3600, // 1 heure

    sendResetPassword: async ({ user, token }) => {
      // On construit le lien vers le front nous-mêmes plutôt que d'utiliser l'`url`
      // fournie par Better Auth : celle-ci passe par une redirection 302 de l'API,
      // que notre proxy Fastify n'a pas vocation à relayer.
      const url = `${APP_ORIGIN}/reset-password?token=${encodeURIComponent(token)}`

      await sendBrevoEmail({
        to: [{ email: user.email, name: user.name }],
        subject: 'Réinitialisation de votre mot de passe — SecondMind',
        htmlContent: buildResetPasswordEmail(url, user.name),
      })
    },
  },

  // À chaque création de session (connexion incluse), on restaure l'organisation
  // active de l'utilisateur. Sans ça, `activeOrganizationId` serait null après une
  // reconnexion → le hook `authenticate` renverrait 403 sur toutes les routes métier.
  // Le `setActive` fait au signup ne couvre que la toute première session.
  databaseHooks: {
    // Garde-fou email : on trime et on refuse tout caractère non-ASCII à la création
    // du compte (seul chemin de création : le signup). Un « â » deviendrait un domaine
    // Punycode (xn--…) et rendrait le compte introuvable au reset. Cf. lib/email.schema.
    user: {
      create: {
        before: async (user) => {
          const email = normalizeEmail(user.email)
          if (!ASCII_EMAIL.test(email)) {
            throw new APIError('BAD_REQUEST', {
              message:
                "L'adresse email ne doit contenir que des caractères ASCII (pas de lettres accentuées ni de caractères spéciaux).",
            })
          }
          return { data: { ...user, email } }
        },
      },
    },

    session: {
      create: {
        before: async (session) => {
          const activeOrganizationId = await findFirstOrganizationIdForUser(session.userId)
          return { data: { activeOrganizationId } }
        },
      },
    },
  },

  plugins: [
    organization(),
  ],
})
