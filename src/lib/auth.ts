import { betterAuth } from 'better-auth'
import { organization } from 'better-auth/plugins'
import { APIError } from 'better-auth/api'
import { db } from '@/lib/db'
import { env } from '@/lib/env'
import { sendBrevoEmail, buildResetPasswordEmail, buildVerifyEmail } from '@/lib/brevo'
import { resolveActiveOrganizationId } from '@/db/datamappers/organization.datamapper'
import { normalizeEmail, ASCII_EMAIL } from '@/lib/email.schema'

// Origine du front : les liens des emails doivent pointer vers l'app, pas vers l'API.
const APP_ORIGIN = env.APP_URL ?? env.CORS_ORIGIN

export const auth = betterAuth({
  appName: 'Estaple',
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,

  database: db,

  trustedOrigins: [env.CORS_ORIGIN, env.BETTER_AUTH_URL],

  emailAndPassword: {
    enabled: true,
    // ⚠️ `disableSignUp` reste à `false` : il bloquerait aussi l'appel interne
    // `auth.api.signUpEmail` dont dépend notre propre route d'inscription.
    // La route native de Better Auth est fermée autrement — le proxy `/auth/*`
    // renvoie 404 sur `/api/auth/sign-up` (cf. `features/auth/auth.routes.ts`).
    // `POST /api/v1/signup` est ainsi la seule porte d'entrée : elle crée le
    // compte, l'organisation, l'adhésion et le projet par défaut d'un bloc.
    disableSignUp: false,
    minPasswordLength: 10,

    // Connexion refusée tant que l'adresse n'est pas confirmée.
    //
    // Indispensable dès lors que l'inscription est publique : une faute de frappe
    // dans l'adresse produirait sinon un compte définitivement inaccessible — même
    // le lien de réinitialisation partirait dans le vide. C'est l'incident du
    // 2026-07-17, qu'une adresse non vérifiée rendrait courant.
    //
    // ⚠️ Dépend entièrement de la délivrabilité. Le 2026-08-08, un envoi affiché
    // « délivré » par Brevo n'est jamais arrivé, pas même en indésirables : plus
    // aucun compte n'était utilisable. Si le cas se reproduit, deux issues sans
    // toucher à ce réglage — le lien est écrit dans les logs en développement, et
    // `UPDATE "user" SET "emailVerified" = true` débloque un compte existant.
    // Avant l'ouverture publique : domaine expéditeur authentifié chez Brevo
    // (DKIM/SPF/DMARC), sans quoi ce réglage bloquera tous les inscrits.
    requireEmailVerification: true,
    maxPasswordLength: 128,

    resetPasswordTokenExpiresIn: 3600, // 1 heure

    sendResetPassword: async ({ user, token }) => {
      // On construit le lien vers le front nous-mêmes plutôt que d'utiliser l'`url`
      // fournie par Better Auth : celle-ci passe par une redirection 302 de l'API,
      // que notre proxy Fastify n'a pas vocation à relayer.
      const url = `${APP_ORIGIN}/reset-password?token=${encodeURIComponent(token)}`

      await sendBrevoEmail({
        to: [{ email: user.email, name: user.name }],
        subject: 'Réinitialisation de votre mot de passe — Estaple',
        htmlContent: buildResetPasswordEmail(url, user.name),
      })
    },
  },

  emailVerification: {
    // L'email de confirmation part tout seul à la création du compte, sans que
    // la route d'inscription ait à le déclencher.
    //
    // ⚠️ Better Auth exécute cet envoi en **tâche de fond** : si Brevo refuse
    // (quota épuisé, clé invalide, panne), l'erreur est journalisée mais
    // l'inscription répond quand même 201. Le compte existe alors sans que son
    // email soit parti — et comme la connexion exige la vérification, il est
    // inutilisable. Vérifié en conditions réelles : clé Brevo invalide → 201,
    // avec « Failed to run background task » dans les logs.
    // C'est pour cette raison que le renvoi de l'email est indispensable, et non
    // un simple confort : c'est le seul chemin de sortie.
    sendOnSignUp: true,
    expiresIn: 86400, // 24 heures

    sendVerificationEmail: async ({ user, token }) => {
      // Lien construit vers le FRONT, comme pour la réinitialisation de mot de
      // passe : l'`url` fournie par Better Auth passe par une redirection 302 de
      // l'API que le proxy Fastify ne relaie pas.
      const url = `${APP_ORIGIN}/verify-email?token=${encodeURIComponent(token)}`

      // En développement uniquement : le lien est aussi écrit dans les logs.
      //
      // Sans cela, dérouler le parcours en local dépend entièrement de la
      // délivrabilité de Brevo — or un message peut être accepté par le serveur
      // destinataire (« délivré » côté Brevo) puis écarté silencieusement, sans
      // même passer par les indésirables. Le compte est alors créé et
      // inactivable, sans aucun moyen d'avancer.
      //
      // ⚠️ Ce lien vaut authentification : jamais en production, où il finirait
      // dans les journaux de Coolify.
      if (env.NODE_ENV !== 'production') {
        console.info(`[dev] Lien de confirmation pour ${user.email} : ${url}`)
      }

      await sendBrevoEmail({
        to: [{ email: user.email, name: user.name }],
        subject: 'Confirmez votre adresse email — Estaple',
        htmlContent: buildVerifyEmail(url, user.name),
      })
    },
  },

  // À chaque création de session (connexion incluse), on restaure l'organisation
  // active de l'utilisateur. Sans ça, `activeOrganizationId` serait null après une
  // reconnexion → le hook `authenticate` renverrait 403 sur toutes les routes métier.
  //
  // La résolution donne la priorité au **dernier workspace choisi**, et retombe
  // sur l'adhésion la plus ancienne à défaut. L'ancienne règle — toujours la plus
  // ancienne — ramenait systématiquement dans le premier espace rejoint quelqu'un
  // qui en fréquente plusieurs.
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
          const activeOrganizationId = await resolveActiveOrganizationId(session.userId)
          return { data: { activeOrganizationId } }
        },
      },
    },
  },

  // Better Auth résout l'IP du client depuis un en-tête. Par défaut il lit
  // `x-forwarded-for` et en prend la PREMIÈRE valeur — forgeable par le client,
  // puisque Traefik se contente d'ajouter la vraie IP à la suite. On lui fait
  // donc lire l'en-tête que le proxy Fastify injecte à partir de `request.ip`
  // (cf. `features/auth/auth.routes.ts`), qui n'est pas manipulable de l'extérieur.
  advanced: {
    ipAddress: {
      ipAddressHeaders: ['x-secondmind-client-ip'],
    },
  },

  // Limitation du débit sur les routes d'authentification.
  //
  // Better Auth embarque son propre limiteur, mais ses réglages par défaut sont
  // insuffisants ici :
  //   · `enabled` vaut `isProduction` → aucune protection ni test possible en local ;
  //   · le défaut global est de 100 requêtes / 10 s ;
  //   · sa règle intégrée sur /sign-in autorise 3 requêtes / 10 s, soit encore
  //     1080 tentatives par heure depuis une même IP — trop pour du brute force patient.
  //
  // ⚠️ Si l'IP ne peut pas être déterminée, Better Auth IGNORE la limitation
  // (un avertissement est écrit une seule fois dans les logs). D'où le soin
  // apporté ci-dessus à la résolution de l'IP.
  //
  // Le stockage est en mémoire (Map du process) : les compteurs repartent à zéro
  // à chaque redéploiement. Acceptable pour un conteneur unique ; à basculer sur
  // `secondary-storage` le jour où l'API tournera en plusieurs instances.
  rateLimit: {
    enabled: true,
    // Défaut volontairement large : /get-session est appelé à chaque chargement
    // de page par le front, il ne doit jamais être bridé.
    window: 10,
    max: 100,
    customRules: {
      // Connexion : 5 essais par quart d'heure en production. Assez permissif
      // pour des fautes de frappe, assez strict pour rendre le brute force vain.
      // Plus souple en local pour ne pas gêner les passages de la collection Bruno.
      '/sign-in/email': {
        window: 900,
        max: env.NODE_ENV === 'production' ? 5 : 30,
      },
      // Réinitialisation : protège aussi le quota Brevo et évite qu'on puisse
      // noyer une boîte mail sous les demandes.
      '/request-password-reset': { window: 3600, max: 3 },
      '/reset-password':         { window: 900,  max: 5 },
      // Renvoi de l'email de confirmation. Plus permissif que la
      // réinitialisation : c'est le seul recours quand le premier envoi a
      // échoué, et l'utilisateur légitime peut avoir à s'y reprendre (spam,
      // lien expiré au bout de 24 h). Assez bas pour ne pas servir d'arme
      // contre une boîte mail, ni contre le quota Brevo.
      '/send-verification-email': { window: 3600, max: 5 },
    },
  },

  plugins: [
    organization(),
  ],
})
