import { db } from '@/lib/db'

export interface OrgSettings {
  organization_id:   string
  default_currency:  string
  default_daily_rate: string | null
  updated_at:        string
}

export interface ClientMember {
  member_id:   string
  user_id:     string
  email:       string
  name:        string
  created_at:  string
  project_ids: string[]
}

export async function getOrCreateSettings(organizationId: string): Promise<OrgSettings> {
  const result = await db.query<OrgSettings>(
    `INSERT INTO organization_settings (organization_id)
     VALUES ($1)
     ON CONFLICT (organization_id) DO UPDATE SET updated_at = organization_settings.updated_at
     RETURNING *`,
    [organizationId]
  )
  return result.rows[0]
}

export async function upsertSettings(
  organizationId: string,
  data: { default_currency?: string; default_daily_rate?: number | null }
): Promise<OrgSettings> {
  const result = await db.query<OrgSettings>(
    `INSERT INTO organization_settings (organization_id, default_currency, default_daily_rate)
     VALUES ($1, COALESCE($2, 'EUR'), $3)
     ON CONFLICT (organization_id) DO UPDATE
       SET default_currency   = COALESCE($2, organization_settings.default_currency),
           default_daily_rate = CASE WHEN $4::boolean THEN $3 ELSE organization_settings.default_daily_rate END,
           updated_at         = now()
     RETURNING *`,
    [
      organizationId,
      data.default_currency ?? null,
      data.default_daily_rate ?? null,
      'default_daily_rate' in data,
    ]
  )
  return result.rows[0]
}

export async function findUserByEmail(email: string): Promise<{ id: string; name: string; email: string } | null> {
  const result = await db.query<{ id: string; name: string; email: string }>(
    `SELECT id, name, email FROM "user" WHERE email = $1`,
    [email]
  )
  return result.rows[0] ?? null
}

export async function findMember(
  userId: string,
  organizationId: string
): Promise<{ id: string; role: string } | null> {
  const result = await db.query<{ id: string; role: string }>(
    `SELECT id, role FROM member WHERE "userId" = $1 AND "organizationId" = $2`,
    [userId, organizationId]
  )
  return result.rows[0] ?? null
}

export async function addClientMember(
  userId: string,
  organizationId: string
): Promise<{ id: string }> {
  const memberId = crypto.randomUUID()
  const result = await db.query<{ id: string }>(
    `INSERT INTO member (id, "userId", "organizationId", role)
     VALUES ($1, $2, $3, 'client')
     ON CONFLICT ("userId", "organizationId") DO UPDATE SET role = 'client'
     RETURNING id`,
    [memberId, userId, organizationId]
  )
  return result.rows[0]
}

export async function removeClientMember(memberId: string, organizationId: string): Promise<boolean> {
  // Supprimer aussi les affectations projets
  const memberResult = await db.query<{ userId: string }>(
    `DELETE FROM member WHERE id = $1 AND "organizationId" = $2 AND role = 'client' RETURNING "userId"`,
    [memberId, organizationId]
  )
  if (!memberResult.rows[0]) return false

  await db.query(
    `DELETE FROM project_client WHERE client_id = $1`,
    [memberResult.rows[0].userId]
  )
  return true
}

export async function listClientMembers(organizationId: string): Promise<ClientMember[]> {
  const result = await db.query<{
    member_id:  string
    user_id:    string
    email:      string
    name:       string
    created_at: string
    project_ids: string | null
  }>(
    `SELECT
       m.id          AS member_id,
       u.id          AS user_id,
       u.email,
       u.name,
       m."createdAt" AS created_at,
       COALESCE(
         array_to_json(array_agg(pc.project_id) FILTER (WHERE pc.project_id IS NOT NULL))::text,
         '[]'
       ) AS project_ids
     FROM member m
     JOIN "user" u ON u.id = m."userId"
     LEFT JOIN project_client pc ON pc.client_id = m."userId"
     WHERE m."organizationId" = $1 AND m.role = 'client'
     GROUP BY m.id, u.id, u.email, u.name, m."createdAt"
     ORDER BY m."createdAt" DESC`,
    [organizationId]
  )

  return result.rows.map((r) => ({
    ...r,
    project_ids: JSON.parse(r.project_ids ?? '[]') as string[],
  }))
}
