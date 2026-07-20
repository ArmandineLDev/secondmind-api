import { db } from '@/lib/db'
import type { SocialLink } from '@/features/crm/contacts/social-link.types'
import type { CreateSocialLinkInput, UpdateSocialLinkInput } from '@/features/crm/contacts/social-link.schema'

export async function findSocialLinksByContact(
  contactId: string,
  organizationId: string
): Promise<SocialLink[]> {
  const result = await db.query<SocialLink>(
    `SELECT sl.*
     FROM contact_social_link sl
     JOIN contact ct ON ct.id = sl.contact_id
     WHERE sl.contact_id = $1 AND ct.organization_id = $2
     ORDER BY sl.position ASC, sl.created_at ASC`,
    [contactId, organizationId]
  )
  return result.rows
}

export async function createSocialLink(
  contactId: string,
  input: CreateSocialLinkInput
): Promise<SocialLink> {
  const result = await db.query<SocialLink>(
    `INSERT INTO contact_social_link (contact_id, platform, label, url, position)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [contactId, input.platform, input.label ?? null, input.url, input.position ?? 0]
  )
  return result.rows[0]
}

export async function updateSocialLink(
  id: string,
  contactId: string,
  organizationId: string,
  input: UpdateSocialLinkInput
): Promise<SocialLink | null> {
  const result = await db.query<SocialLink>(
    `UPDATE contact_social_link AS sl
     SET platform = COALESCE($4, sl.platform),
         url      = COALESCE($5, sl.url),
         position = COALESCE($6, sl.position),
         label    = CASE WHEN $7::boolean THEN $8 ELSE sl.label END
     FROM contact ct
     WHERE sl.id = $1 AND sl.contact_id = $2 AND ct.id = sl.contact_id AND ct.organization_id = $3
     RETURNING sl.*`,
    [
      id,
      contactId,
      organizationId,
      input.platform ?? null,
      input.url      ?? null,
      input.position ?? null,
      'label' in input, input.label ?? null,
    ]
  )
  return result.rows[0] ?? null
}

export async function deleteSocialLink(
  id: string,
  contactId: string,
  organizationId: string
): Promise<boolean> {
  const result = await db.query(
    `DELETE FROM contact_social_link AS sl
     USING contact ct
     WHERE sl.id = $1 AND sl.contact_id = $2 AND ct.id = sl.contact_id AND ct.organization_id = $3`,
    [id, contactId, organizationId]
  )
  return (result.rowCount ?? 0) > 0
}
