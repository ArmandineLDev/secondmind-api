import { betterAuth } from 'better-auth'
import { organization } from 'better-auth/plugins'
import { db } from '@/lib/db'
import { env } from '@/lib/env'
// import { sendBrevoEmail, buildVerificationEmail, buildResetPasswordEmail } from '@/lib/brevo'

const SENDER = { email: env.BREVO_SENDER_EMAIL, name: env.BREVO_SENDER_NAME }

export const auth = betterAuth({
  appName: 'SecondMind',
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,

  database: db,

  trustedOrigins: [env.CORS_ORIGIN, env.BETTER_AUTH_URL],

  emailAndPassword: {
    enabled: true,
    minPasswordLength: 10,
    maxPasswordLength: 128,
    /*requireEmailVerification: true,
    sendResetPassword: async ({ user, url }) => {
      await sendBrevoEmail({
        apiKey: env.BREVO_API_KEY,
        sender: SENDER,
        to: [{ email: user.email, name: user.name }],
        subject: 'Réinitialisation de votre mot de passe — SecondMind',
        htmlContent: buildResetPasswordEmail(url, user.name),
      })
    } */ },

//   emailVerification: {
//     sendVerificationEmail: async ({ user, url }) => {
//       await sendBrevoEmail({
//         apiKey: env.BREVO_API_KEY,
//         sender: SENDER,
//         to: [{ email: user.email, name: user.name }],
//         subject: 'Vérifiez votre adresse email — SecondMind',
//         htmlContent: buildVerificationEmail(url, user.name),
//       })
//     },
//   },

  plugins: [
    organization(),
  ],
})
