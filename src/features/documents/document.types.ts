export type DocumentType = 'spec' | 'contract' | 'invoice' | 'other'

export interface Document {
  id:              string
  organization_id: string
  /** Destinataire du document. NULL = document interne. */
  client_id:       string | null
  project_id:      string | null
  name:            string
  type:            DocumentType
  file_key:        string
  file_size:       number
  mime_type:       string
  uploaded_at:     Date
}
