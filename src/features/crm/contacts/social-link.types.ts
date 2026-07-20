export type SocialPlatform = 'instagram' | 'facebook' | 'linkedin' | 'telegram' | 'whatsapp' | 'other'

export interface SocialLink {
  id: string
  contact_id: string
  platform: SocialPlatform
  label: string | null
  url: string
  position: number
  created_at: Date
}
