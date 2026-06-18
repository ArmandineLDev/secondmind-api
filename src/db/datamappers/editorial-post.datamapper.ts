import { db } from '@/lib/db'
import type { EditorialPost } from '@/features/marketing/editorial-posts/editorial-post.types'
import type { CreatePostInput, UpdatePostInput, PostQuery } from '@/features/marketing/editorial-posts/editorial-post.schema'

export async function findAllPosts(
  organizationId: string,
  query: PostQuery
): Promise<EditorialPost[]> {
  const conditions: string[] = ['organization_id = $1']
  const params: unknown[] = [organizationId]
  let i = 2

  if (query.network) {
    conditions.push(`network = $${i++}`)
    params.push(query.network)
  }
  if (query.status) {
    conditions.push(`status = $${i++}`)
    params.push(query.status)
  }
  if (query.year) {
    conditions.push(`EXTRACT(YEAR FROM COALESCE(scheduled_at, created_at)) = $${i++}`)
    params.push(query.year)
  }
  if (query.month) {
    conditions.push(`EXTRACT(MONTH FROM COALESCE(scheduled_at, created_at)) = $${i++}`)
    params.push(query.month)
  }

  const result = await db.query<EditorialPost>(
    `SELECT * FROM editorial_post
     WHERE ${conditions.join(' AND ')}
     ORDER BY COALESCE(scheduled_at, created_at) DESC`,
    params
  )
  return result.rows
}

export async function findPostById(
  id: string,
  organizationId: string
): Promise<EditorialPost | null> {
  const result = await db.query<EditorialPost>(
    `SELECT * FROM editorial_post WHERE id = $1 AND organization_id = $2`,
    [id, organizationId]
  )
  return result.rows[0] ?? null
}

export async function createPost(
  organizationId: string,
  input: CreatePostInput
): Promise<EditorialPost> {
  const result = await db.query<EditorialPost>(
    `INSERT INTO editorial_post (organization_id, persona_id, network, status, title, content, scheduled_at, published_at, tags)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
    [
      organizationId,
      input.persona_id   ?? null,
      input.network,
      input.status,
      input.title        ?? null,
      input.content      ?? null,
      input.scheduled_at ?? null,
      input.published_at ?? null,
      input.tags,
    ]
  )
  return result.rows[0]
}

export async function updatePost(
  id: string,
  organizationId: string,
  input: UpdatePostInput
): Promise<EditorialPost | null> {
  const result = await db.query<EditorialPost>(
    `UPDATE editorial_post
     SET network      = COALESCE($3, network),
         status       = COALESCE($4, status),
         tags         = COALESCE($5, tags),
         title        = CASE WHEN $6::boolean  THEN $7  ELSE title        END,
         content      = CASE WHEN $8::boolean  THEN $9  ELSE content      END,
         persona_id   = CASE WHEN $10::boolean THEN $11 ELSE persona_id   END,
         scheduled_at = CASE WHEN $12::boolean THEN $13 ELSE scheduled_at END,
         published_at = CASE WHEN $14::boolean THEN $15 ELSE published_at END
     WHERE id = $1 AND organization_id = $2
     RETURNING *`,
    [
      id,
      organizationId,
      input.network ?? null,
      input.status  ?? null,
      input.tags    ?? null,
      'title'        in input, input.title        ?? null,
      'content'      in input, input.content      ?? null,
      'persona_id'   in input, input.persona_id   ?? null,
      'scheduled_at' in input, input.scheduled_at ?? null,
      'published_at' in input, input.published_at ?? null,
    ]
  )
  return result.rows[0] ?? null
}

export async function deletePost(id: string, organizationId: string): Promise<boolean> {
  const result = await db.query(
    `DELETE FROM editorial_post WHERE id = $1 AND organization_id = $2`,
    [id, organizationId]
  )
  return (result.rowCount ?? 0) > 0
}
