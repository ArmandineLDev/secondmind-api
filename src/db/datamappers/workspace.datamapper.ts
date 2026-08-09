import { randomUUID } from 'node:crypto'
import { db } from '@/lib/db'

export interface CreatedWorkspace {
  organizationId: string
  slug:           string
  projectId:      string
}

// Colonnes du kanban créées avec le projet par défaut. Mêmes valeurs que
// `createDefaultColumns` (column.datamapper) — dupliquées ici à dessein : cette
// fonction s'exécute dans une transaction et ne peut pas appeler un datamapper
// qui prend son propre client dans le pool.
const DEFAULT_COLUMNS = [
  { name: 'À faire',  color: null,      position: 1 },
  { name: 'En cours', color: '#c8714f', position: 2 },
  { name: 'Terminé',  color: '#2d8a52', position: 3 },
]

/**
 * Crée le workspace complet d'un utilisateur fraîchement inscrit, en une seule
 * transaction : organisation, adhésion `owner`, projet par défaut et ses colonnes.
 *
 * Tout ou rien. C'est le point central du correctif : la version précédente
 * enchaînait ces appels **depuis le navigateur** (`use-signup.hook.ts`), si bien
 * qu'un échec après la création du compte laissait un utilisateur sans
 * organisation — donc 403 sur toutes les routes, sans possibilité de se
 * réinscrire puisque l'email était déjà pris, et sans aucun chemin de réparation.
 *
 * Le slug est rendu unique ici plutôt que subi : `organization.slug` porte une
 * contrainte UNIQUE, et deux personnes nommant leur workspace « Mon Studio »
 * étaient une certitude, pas une hypothèse.
 */
export async function createWorkspace(
  userId: string,
  organizationName: string,
): Promise<CreatedWorkspace> {
  const client = await db.connect()

  try {
    await client.query('BEGIN')

    const organizationId = randomUUID()
    const slug = await resolveUniqueSlug(client, slugify(organizationName))

    await client.query(
      `INSERT INTO "organization" (id, name, slug) VALUES ($1, $2, $3)`,
      [organizationId, organizationName, slug],
    )

    await client.query(
      `INSERT INTO "member" (id, "userId", "organizationId", role) VALUES ($1, $2, $3, 'owner')`,
      [randomUUID(), userId, organizationId],
    )

    // Projet par défaut : seul endroit du code qui pose `is_default = true`.
    // L'index partiel project_one_default_per_organization en garantit l'unicité.
    const project = await client.query<{ id: string }>(
      `INSERT INTO project (organization_id, name, description, status, is_default)
       VALUES ($1, 'Divers', 'Projet par défaut — pour les tâches qui ne relèvent d''aucun autre projet.', 'in_progress', true)
       RETURNING id`,
      [organizationId],
    )
    const projectId = project.rows[0].id

    await client.query(
      `INSERT INTO kanban_column (project_id, name, color, position)
       SELECT $1, col.name, col.color, col.position
         FROM jsonb_to_recordset($2::jsonb) AS col(name text, color text, position int)`,
      [projectId, JSON.stringify(DEFAULT_COLUMNS)],
    )

    await client.query('COMMIT')
    return { organizationId, slug, projectId }
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

/**
 * Supprime un utilisateur et tout ce qui en dépend.
 *
 * Sert uniquement de compensation quand la création du workspace échoue après
 * celle du compte : les deux opérations ne peuvent pas partager une transaction,
 * puisque Better Auth écrit avec sa propre connexion. Mieux vaut rendre
 * l'inscription rejouable que laisser un compte inutilisable derrière soi.
 *
 * Les tables `session` et `account` sont en ON DELETE CASCADE (auth_0001).
 */
export async function deleteUserById(userId: string): Promise<void> {
  await db.query(`DELETE FROM "user" WHERE id = $1`, [userId])
}

export async function emailIsTaken(email: string): Promise<boolean> {
  const result = await db.query(`SELECT 1 FROM "user" WHERE lower(email) = lower($1) LIMIT 1`, [email])
  return result.rowCount !== null && result.rowCount > 0
}

export async function userExists(userId: string): Promise<boolean> {
  const result = await db.query(`SELECT 1 FROM "user" WHERE id = $1`, [userId])
  return result.rowCount !== null && result.rowCount > 0
}

export function slugify(value: string): string {
  const slug = value
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)

  // Un nom composé uniquement de caractères non latins (« 日本 ») ou de
  // ponctuation donnerait une chaîne vide, donc un slug vide partagé par tous.
  return slug || 'workspace'
}

/**
 * Ajoute un suffixe numérique tant que le slug est pris : `mon-studio`,
 * `mon-studio-2`, `mon-studio-3`…
 *
 * La lecture et l'insertion ont lieu dans la même transaction : deux inscriptions
 * simultanées avec le même nom pourraient encore entrer en collision sur le
 * UNIQUE. C'est assumé — l'appelant retente, et le cas est rare. Un compteur
 * verrouillé coûterait plus cher que le problème qu'il résout.
 */
async function resolveUniqueSlug(
  client: { query: typeof db.query },
  base: string,
): Promise<string> {
  const taken = await client.query<{ slug: string }>(
    `SELECT slug FROM "organization" WHERE slug = $1 OR slug LIKE $1 || '-%'`,
    [base],
  )
  if (taken.rows.length === 0) return base

  const used = new Set(taken.rows.map((row) => row.slug))
  if (!used.has(base)) return base

  for (let suffix = 2; suffix < 1000; suffix++) {
    const candidate = `${base}-${suffix}`
    if (!used.has(candidate)) return candidate
  }

  return `${base}-${randomUUID().slice(0, 8)}`
}
