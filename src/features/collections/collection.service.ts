import type { CollectionField } from './collection.types'

/**
 * Résultat d'une validation : soit des données normalisées prêtes à écrire,
 * soit un message destiné à l'utilisateur.
 *
 * Le service ignore volontairement HTTP — c'est le controller qui traduit
 * `ok: false` en 400. Il reste ainsi testable sans Fastify.
 */
export type ValidationResult =
  | { ok: true;  data: Record<string, unknown> }
  | { ok: false; message: string }

/** Une cellule vide n'est pas stockée : `data` ne garde que ce qui est saisi. */
function isEmpty(value: unknown): boolean {
  return value === null || value === undefined || value === ''
}

/**
 * Normalise une URL saisie à la main.
 *
 * On ne peut pas se contenter d'un `new URL()` strict : personne ne tape le
 * schéma. On le complète par `https://`, ce qui rend la valeur directement
 * utilisable dans un `href` côté web sans traitement supplémentaire.
 */
function normalizeUrl(raw: string): string | null {
  const candidate = /^[a-z][a-z0-9+.-]*:\/\//i.test(raw) ? raw : `https://${raw}`
  try {
    return new URL(candidate).toString()
  } catch {
    return null
  }
}

/** `YYYY-MM-DD` — et une date qui existe réellement (le 31 février est refusé). */
function isValidDate(raw: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return false
  const date = new Date(`${raw}T00:00:00Z`)
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === raw
}

function validateValue(field: CollectionField, value: unknown): { ok: true; value: unknown } | { ok: false; reason: string } {
  switch (field.type) {
    case 'text':
      return typeof value === 'string'
        ? { ok: true, value }
        : { ok: false, reason: 'attend du texte' }

    case 'number': {
      // L'éditeur de tableau renvoie la saisie brute d'un `<input>` : une
      // chaîne. On convertit ici plutôt que d'imposer la contrainte au front.
      const num = typeof value === 'number' ? value : Number(value)
      return typeof value !== 'boolean' && !Number.isNaN(num)
        ? { ok: true, value: num }
        : { ok: false, reason: 'attend un nombre' }
    }

    case 'checkbox':
      return typeof value === 'boolean'
        ? { ok: true, value }
        : { ok: false, reason: 'attend une case cochée ou décochée' }

    case 'date':
      return typeof value === 'string' && isValidDate(value)
        ? { ok: true, value }
        : { ok: false, reason: 'attend une date au format AAAA-MM-JJ' }

    case 'url': {
      if (typeof value !== 'string') return { ok: false, reason: 'attend une adresse web' }
      const url = normalizeUrl(value.trim())
      return url ? { ok: true, value: url } : { ok: false, reason: 'attend une adresse web valide' }
    }

    case 'select': {
      const options = field.options ?? []
      return typeof value === 'string' && options.includes(value)
        ? { ok: true, value }
        : { ok: false, reason: `attend l'un des choix : ${options.join(', ')}` }
    }
  }
}

/**
 * Convertit au mieux une valeur vers le type d'une colonne, ou renvoie
 * `undefined` si c'est impossible.
 *
 * Sert au changement de type d'une colonne : « 42 » saisi en texte devient le
 * nombre 42, tandis que « bonjour » est abandonné. Sans cette reprise, toute la
 * colonne serait perdue au moindre changement de type.
 */
export function coerceValue(field: CollectionField, value: unknown): unknown | undefined {
  if (isEmpty(value)) return undefined
  const result = validateValue(field, value)
  return result.ok ? result.value : undefined
}

/**
 * Calcule le type et les choix effectifs d'une colonne après modification.
 *
 * Indispensable parce qu'une mise à jour est partielle : `{ type: 'text' }` sur
 * une colonne « select » passerait la validation du schéma Zod (qui ne voit que
 * la charge utile) puis violerait le CHECK en base — donc une 500 incompréhensible.
 */
export function resolveFieldChange(
  current: CollectionField,
  input: { type?: CollectionField['type']; options?: string[] | null }
): { ok: true; type: CollectionField['type']; options: string[] | null } | { ok: false; message: string } {
  const type = input.type ?? current.type
  const optionsGiven = 'options' in input
  // Passer à un type sans choix vide la liste plutôt que de refuser : c'est la
  // seule issue cohérente, et l'utilisateur qui change le type l'a en tête.
  const options = type !== 'select'
    ? null
    : optionsGiven ? (input.options ?? null) : current.options

  if (type === 'select' && (!options || options.length === 0)) {
    return { ok: false, message: 'Un champ « select » exige au moins un choix' }
  }
  return { ok: true, type, options }
}

/**
 * Confronte les valeurs d'une entrée à la définition des colonnes.
 *
 * C'est le seul garde-fou côté serveur : `data` est un JSONB libre, la base ne
 * vérifie que sa forme d'objet. Sans ce passage, une colonne « nombre »
 * pourrait contenir du texte et le tri à l'écran deviendrait absurde.
 *
 * Une clé qui ne correspond à aucun champ est refusée plutôt qu'ignorée : la
 * laisser passer produirait des données invisibles à l'écran mais bien
 * présentes en base, et donc à l'export.
 */
export function validateItemData(
  fields: CollectionField[],
  data: Record<string, unknown>
): ValidationResult {
  const byId = new Map(fields.map((field) => [field.id, field]))
  const normalized: Record<string, unknown> = {}

  for (const [fieldId, value] of Object.entries(data)) {
    const field = byId.get(fieldId)
    if (!field) {
      return { ok: false, message: `La colonne « ${fieldId} » n'existe pas dans cette fiche` }
    }

    if (isEmpty(value)) continue

    const result = validateValue(field, value)
    if (!result.ok) {
      return { ok: false, message: `La colonne « ${field.name} » ${result.reason}` }
    }
    normalized[fieldId] = result.value
  }

  return { ok: true, data: normalized }
}
