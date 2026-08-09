import { db } from '@/lib/db'

export interface Workspace {
  id:   string
  name: string
  slug: string
  role: string
}

/**
 * Organisation à activer à l'ouverture d'une session.
 *
 * Priorité au dernier workspace choisi (`user.lastOrganizationId`), à condition
 * que l'adhésion existe toujours — un accès révoqué entre deux connexions ne
 * doit pas ramener l'utilisateur dans un espace qui n'est plus le sien.
 *
 * À défaut, on retombe sur l'adhésion la plus ancienne. C'était l'unique règle
 * jusqu'ici, et elle envoyait systématiquement quelqu'un appartenant à deux
 * espaces dans le premier qu'il avait rejoint — éventuellement celui d'un autre,
 * où il n'est que client.
 *
 * Renvoie `null` si l'utilisateur n'est membre de rien : `authenticate` répondra
 * alors 403 « Aucun workspace actif ».
 */
export async function resolveActiveOrganizationId(userId: string): Promise<string | null> {
  const result = await db.query<{ organizationId: string }>(
    `SELECT COALESCE(
              (SELECT m."organizationId"
                 FROM "member" m
                 JOIN "user" u ON u.id = m."userId"
                WHERE m."userId" = $1
                  AND m."organizationId" = u."lastOrganizationId"),
              (SELECT m."organizationId"
                 FROM "member" m
                WHERE m."userId" = $1
                ORDER BY m."createdAt" ASC
                LIMIT 1)
            ) AS "organizationId"`,
    [userId],
  )
  return result.rows[0]?.organizationId ?? null
}

/** Workspaces dont l'utilisateur est membre, avec son rôle dans chacun. */
export async function findWorkspacesForUser(userId: string): Promise<Workspace[]> {
  const result = await db.query<Workspace>(
    `SELECT o.id, o.name, o.slug, m.role
       FROM "member" m
       JOIN "organization" o ON o.id = m."organizationId"
      WHERE m."userId" = $1
      ORDER BY o.name ASC`,
    [userId],
  )
  return result.rows
}

/**
 * Bascule la session courante sur un autre workspace, et mémorise le choix.
 *
 * `activeOrganizationId` est une colonne de la table `session` : la mettre à
 * jour suffit, la lecture suivante de la session la verra. On évite ainsi de
 * passer par `POST /organization/set-active` de Better Auth, qui repose sur la
 * pose d'un nouveau cookie — un aller-retour de plus à travers le proxy Fastify,
 * pour un résultat identique.
 *
 * ⚠️ Cela suppose que le cache de session en cookie reste désactivé
 * (`session.cookieCache`, non activé dans `lib/auth.ts`). S'il était activé un
 * jour, la session serait lue depuis le cookie signé et cette mise à jour
 * passerait inaperçue jusqu'à expiration du cache.
 *
 * Renvoie `false` si l'utilisateur n'est pas membre du workspace visé — c'est
 * **la** garde de sécurité de cette fonctionnalité, elle ne doit jamais sauter.
 */
export async function switchWorkspace(
  userId: string,
  sessionToken: string,
  organizationId: string,
): Promise<boolean> {
  const client = await db.connect()
  try {
    await client.query('BEGIN')

    const member = await client.query(
      `SELECT 1 FROM "member" WHERE "userId" = $1 AND "organizationId" = $2`,
      [userId, organizationId],
    )
    if (member.rowCount === 0) {
      await client.query('ROLLBACK')
      return false
    }

    await client.query(
      `UPDATE "session" SET "activeOrganizationId" = $1, "updatedAt" = now()
        WHERE token = $2 AND "userId" = $3`,
      [organizationId, sessionToken, userId],
    )

    await client.query(
      `UPDATE "user" SET "lastOrganizationId" = $1, "updatedAt" = now() WHERE id = $2`,
      [organizationId, userId],
    )

    await client.query('COMMIT')
    return true
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}
