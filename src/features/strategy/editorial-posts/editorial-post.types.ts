export type PostNetwork = 'linkedin' | 'instagram' | 'facebook' | 'twitter' | 'tiktok' | 'other'
export type PostStatus  = 'idea' | 'draft' | 'scheduled' | 'published'

export interface EditorialPost {
  id: string
  organization_id: string
  persona_id: string | null
  network: PostNetwork
  title: string | null
  content: string | null
  status: PostStatus
  scheduled_at: Date | null
  published_at: Date | null
  tags: string[]
  created_at: Date
  updated_at: Date
}
