import { db } from '@/lib/db'

/**
 * Export des données d'un compte — RGPD art. 15 (accès) et art. 20 (portabilité).
 *
 * Deux exports distincts, parce que les deux rôles ne détiennent pas la même chose :
 *
 *   - un `owner` a fourni l'intégralité du contenu de son workspace, il l'emporte ;
 *   - un `client` invité n'a fourni que son identité : les documents qu'il consulte
 *     appartiennent à l'activité de l'owner (cf. `document_0002_client_nullable.sql`),
 *     ils sont listés au titre du droit d'accès mais ne lui sont pas transférés.
 *
 * Voir `docs/rgpd.md` §1 pour le partage des rôles responsable / sous-traitant.
 */

// ─── Cartographie du workspace ────────────────────────────────────────────────
//
// Les noms de tables ci-dessous sont des littéraux du code, jamais une entrée
// utilisateur : ils sont interpolés dans le SQL alors que la seule valeur
// variable, `organization_id`, reste passée en paramètre ($1).
//
// Deux familles, parce qu'elles ne se filtrent pas de la même façon :
// celles qui portent `organization_id`, et celles qui n'y accèdent que par
// leur parent. Toute nouvelle table métier doit être ajoutée ici, sinon elle
// sortira silencieusement de l'export.

/** Tables filtrables directement sur `organization_id`. */
const OWNED_TABLES = [
  'project',
  'task',
  'contact',
  'company',
  'opportunity',
  'invoice',
  'expense',
  'time_entry',
  'document',
  'offer',
  'persona',
  'goal',
  'editorial_post',
  'swot_analysis',
  'business_model_canvas',
  'value_proposition_canvas',
  'collection',
  'organization_settings',
] as const

/** Tables rattachées au workspace par un parent, avec leur condition propre. */
const CHILD_TABLES: Record<string, string> = {
  kanban_column:       'project_id IN (SELECT id FROM project WHERE organization_id = $1)',
  budget:              'project_id IN (SELECT id FROM project WHERE organization_id = $1)',
  project_client:      'project_id IN (SELECT id FROM project WHERE organization_id = $1)',
  project_user:        'project_id IN (SELECT id FROM project WHERE organization_id = $1)',
  task_dependency:     'task_id IN (SELECT id FROM task WHERE organization_id = $1)',
  contact_social_link: 'contact_id IN (SELECT id FROM contact WHERE organization_id = $1)',
  interaction:
    'contact_id IN (SELECT id FROM contact WHERE organization_id = $1) '
    + 'OR opportunity_id IN (SELECT id FROM opportunity WHERE organization_id = $1)',
  collection_field:    'collection_id IN (SELECT id FROM collection WHERE organization_id = $1)',
  collection_item:     'collection_id IN (SELECT id FROM collection WHERE organization_id = $1)',
}

/**
 * Construit le fragment `'<clé>', COALESCE((SELECT json_agg(t) FROM …), '[]')`
 * pour chaque table. `json_agg` renvoie NULL sur un ensemble vide, d'où le
 * COALESCE : un module non utilisé doit apparaître comme `[]`, pas comme `null`,
 * pour que l'export ait la même forme quel que soit l'usage réel.
 */
function buildWorkspaceSelect(): string {
  const fragments = [
    ...OWNED_TABLES.map(
      (t) => `'${t}', COALESCE((SELECT json_agg(x) FROM ${t} x WHERE x.organization_id = $1), '[]'::json)`
    ),
    ...Object.entries(CHILD_TABLES).map(
      ([t, where]) => `'${t}', COALESCE((SELECT json_agg(x) FROM ${t} x WHERE ${where}), '[]'::json)`
    ),
  ]
  return `json_build_object(${fragments.join(', ')})`
}

export interface AccountExport {
  account: Record<string, unknown>
  memberships: Record<string, unknown>[]
  workspaces?: Record<string, unknown>[]
  shared_documents?: Record<string, unknown>[]
}

/**
 * Identité du compte, commune aux deux rôles.
 *
 * `account` (Better Auth) contient le mot de passe haché et les jetons OAuth :
 * ils sont exclus. Le droit d'accès porte sur les données personnelles, pas sur
 * les secrets d'authentification — les restituer serait un risque, sans bénéfice.
 */
async function findAccountIdentity(userId: string): Promise<Record<string, unknown> | null> {
  const result = await db.query(
    `SELECT u.id, u.name, u.email, u."emailVerified", u.image, u."createdAt", u."updatedAt",
            COALESCE(
              (SELECT json_agg(json_build_object(
                 'providerId', a."providerId",
                 'createdAt',  a."createdAt"
               )) FROM account a WHERE a."userId" = u.id),
              '[]'::json
            ) AS auth_providers
     FROM "user" u
     WHERE u.id = $1`,
    [userId]
  )
  return (result.rows[0] as Record<string, unknown>) ?? null
}

/** Adhésions du compte, tous workspaces confondus. */
async function findMemberships(userId: string): Promise<Record<string, unknown>[]> {
  const result = await db.query(
    `SELECT o.id AS organization_id, o.name AS organization_name, m.role, m."createdAt" AS joined_at
     FROM member m
     JOIN "organization" o ON o.id = m."organizationId"
     WHERE m."userId" = $1
     ORDER BY m."createdAt"`,
    [userId]
  )
  return result.rows as Record<string, unknown>[]
}

/**
 * Export d'un compte `owner` : identité + contenu intégral de chaque workspace
 * dont il est propriétaire.
 *
 * Un owner peut en détenir plusieurs, d'où la boucle. Chaque workspace tient en
 * **une seule requête** : PostgreSQL agrège les 27 tables en un objet JSON, ce qui
 * évite autant d'allers-retours réseau que de tables.
 */
export async function exportOwnerData(userId: string): Promise<AccountExport | null> {
  const account = await findAccountIdentity(userId)
  if (!account) return null

  const memberships = await findMemberships(userId)
  const ownedIds = memberships
    .filter((m) => m.role === 'owner')
    .map((m) => m.organization_id as string)

  const select = buildWorkspaceSelect()
  const workspaces = await Promise.all(
    ownedIds.map(async (organizationId) => {
      const result = await db.query(
        `SELECT (SELECT row_to_json(o) FROM "organization" o WHERE o.id = $1) AS workspace,
                ${select} AS content`,
        [organizationId]
      )
      return result.rows[0] as Record<string, unknown>
    })
  )

  return { account, memberships, workspaces }
}

/**
 * Export d'un compte `client` invité : son identité, ses adhésions, et la liste
 * des documents qui lui sont adressés.
 *
 * Les documents sont **listés, pas transférés** : les fichiers appartiennent à
 * l'owner qui les a déposés. Le client y accède par l'application tant que son
 * compte est actif ; l'export lui dit ce qui existe, pas ce qu'il emporte.
 */
export async function exportClientData(userId: string): Promise<AccountExport | null> {
  const account = await findAccountIdentity(userId)
  if (!account) return null

  const [memberships, documents] = await Promise.all([
    findMemberships(userId),
    db.query(
      // `file_key` est volontairement exclu : c'est la clé S3 interne, elle ne
      // dit rien à la personne et expose l'organisation du bucket.
      `SELECT d.id, d.name, d.type, d.mime_type, d.file_size, d.uploaded_at,
              p.name AS project_name
       FROM document d
       LEFT JOIN project p ON p.id = d.project_id
       WHERE d.client_id = $1
       ORDER BY d.uploaded_at DESC`,
      [userId]
    ),
  ])

  return {
    account,
    memberships,
    shared_documents: documents.rows as Record<string, unknown>[],
  }
}
