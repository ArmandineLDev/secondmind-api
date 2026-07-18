import { z } from 'zod'

// Un email ne doit contenir que des caractères ASCII. Un caractère accentué
// (ex. « â ») transforme le domaine en Punycode (xn--…) au moment du stockage :
// le compte devient alors introuvable si l'utilisateur retape la version « propre »
// de l'adresse. C'est exactement l'incident du 2026-07-17 (reset de mot de passe
// silencieusement sans effet). On rejette donc tout caractère hors ASCII à la source.
export const ASCII_EMAIL = /^[\x00-\x7F]+$/

const ACCENT_MESSAGE =
  "L'adresse email ne doit contenir que des caractères ASCII (pas de lettres accentuées ni de caractères spéciaux)."

// Normalisation minimale et sans risque : on retire les espaces superflus.
// On ne force volontairement PAS les minuscules ici (Better Auth compare l'email
// à l'identique ; lowercaser le stockage sans lowercaser aussi login/reset
// casserait les connexions en casse mixte).
export function normalizeEmail(email: string): string {
  return email.trim()
}

// Schéma Zod partagé pour tout email saisi côté API (invitation client, contacts…).
export const emailSchema = z
  .string()
  .trim()
  .max(255, 'Adresse email trop longue.')
  .refine((value) => ASCII_EMAIL.test(value), { message: ACCENT_MESSAGE })
  .pipe(z.email('Adresse email invalide.'))
