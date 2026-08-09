import { APIError } from 'better-auth/api'
import { auth } from '@/lib/auth'
import {
  createWorkspace,
  deleteUserById,
  emailIsTaken,
  userExists,
} from '@/db/datamappers/workspace.datamapper'
import type { SignupInput } from './signup.schema'

export interface SignupResult {
  userId:         string
  organizationId: string
}

export class SignupError extends Error {
  constructor(message: string, readonly status: number) {
    super(message)
  }
}

/**
 * Inscription complète : compte, organisation, adhésion `owner`, projet par défaut.
 *
 * Pourquoi côté serveur, et pourquoi en deux temps.
 *
 * Le compte et le workspace ne peuvent pas partager une transaction PostgreSQL :
 * Better Auth écrit avec sa propre connexion, hors de notre pool. La séquence est
 * donc « créer le compte, puis créer le workspace dans une transaction, et
 * détruire le compte si celle-ci échoue ».
 *
 * Ce n'est pas de l'atomicité au sens strict, mais c'en est l'effet observable :
 * on ne peut pas se retrouver avec un compte sans workspace. C'est précisément ce
 * que produisait la version précédente, qui enchaînait ces appels depuis le
 * navigateur — un compte orphelin y était définitif, l'utilisateur recevant 403
 * sur toute l'application sans pouvoir se réinscrire.
 */
const EMAIL_TAKEN = 'Un compte existe déjà avec cette adresse email.'

export async function signup(input: SignupInput): Promise<SignupResult> {
  // Contrôle préalable de l'unicité de l'email, plutôt que de s'en remettre à
  // l'erreur de Better Auth. Sur une adresse déjà prise, `signUpEmail` ne lève
  // rien d'exploitable : il annule sa propre transaction mais renvoie tout de
  // même un utilisateur, dont l'`id` ne correspond à aucune ligne. Créer le
  // workspace là-dessus échouait sur la clé étrangère de `member` et produisait
  // un 500 incompréhensible là où il fallait un 409.
  if (await emailIsTaken(input.email)) {
    throw new SignupError(EMAIL_TAKEN, 409)
  }

  const userId = await createAccount(input)

  // Filet pour la course entre le contrôle ci-dessus et la création : deux
  // inscriptions simultanées sur la même adresse. La seconde retombe ici, avec
  // le bon message plutôt qu'une violation de contrainte.
  if (!(await userExists(userId))) {
    throw new SignupError(EMAIL_TAKEN, 409)
  }

  try {
    const { organizationId } = await createWorkspace(userId, input.organizationName)
    return { userId, organizationId }
  } catch (error) {
    // Compensation : sans elle, l'email resterait pris par un compte inutilisable.
    // Si elle échoue à son tour, on le signale — il faudra intervenir à la main,
    // mais l'incident est alors tracé plutôt que silencieux.
    try {
      await deleteUserById(userId)
    } catch (cleanupError) {
      throw new AggregateError(
        [error, cleanupError],
        `Inscription échouée et compte ${userId} non nettoyé — intervention manuelle requise.`,
      )
    }
    throw error
  }
}

async function createAccount(input: SignupInput): Promise<string> {
  try {
    const result = await auth.api.signUpEmail({
      body: { name: input.name, email: input.email, password: input.password },
    })
    return result.user.id
  } catch (error) {
    // Better Auth signale l'email déjà pris par une APIError 422.
    // On la retraduit : le message brut est en anglais et exposerait sa mécanique.
    if (error instanceof APIError) {
      const status = typeof error.status === 'number' ? error.status : 400
      if (status === 422 || /already exists|existing/i.test(error.message)) {
        throw new SignupError(EMAIL_TAKEN, 409)
      }
      throw new SignupError(error.message, status >= 400 && status < 500 ? status : 400)
    }
    throw error
  }
}
