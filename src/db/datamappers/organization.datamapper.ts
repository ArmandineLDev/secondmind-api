import { db } from '@/lib/db'

// Retourne l'id de l'organisation la plus ancienne dont l'utilisateur est membre,
// ou null s'il n'en a aucune (ex. un client invité qui n'est pas membre d'une org).
// Sert à restaurer l'organisation active à chaque nouvelle session (cf. auth.ts).
export async function findFirstOrganizationIdForUser(userId: string): Promise<string | null> {
  const result = await db.query<{ organizationId: string }>(
    `SELECT "organizationId"
       FROM "member"
      WHERE "userId" = $1
      ORDER BY "createdAt" ASC
      LIMIT 1`,
    [userId]
  )
  return result.rows[0]?.organizationId ?? null
}
