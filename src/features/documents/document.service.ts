import { randomUUID } from 'crypto'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import { s3, getDownloadSignedUrl, deleteObject } from '@/lib/storage'
import { env } from '@/lib/env'
import * as dm from '@/db/datamappers/document.datamapper'
import type { DocumentMeta } from './document.schema'
import type { Document } from './document.types'

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'text/csv',
])

export function isMimeTypeAllowed(mimeType: string): boolean {
  return ALLOWED_MIME_TYPES.has(mimeType)
}

export async function uploadDocument(
  organizationId: string,
  currentUserId:  string,
  meta:           DocumentMeta,
  fileBuffer:     Buffer,
  mimeType:       string,
  fileSize:       number
): Promise<Document> {
  const ext     = mimeType.split('/').at(-1)?.replace('vnd.openxmlformats-officedocument.wordprocessingml.document', 'docx').replace('vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'xlsx').replace('vnd.ms-excel', 'xls').replace('msword', 'doc') ?? 'bin'
  const fileKey = `${organizationId}/${randomUUID()}.${ext}`

  await s3.send(new PutObjectCommand({
    Bucket:      env.SCALEWAY_BUCKET,
    Key:         fileKey,
    Body:        fileBuffer,
    ContentType: mimeType,
  }))

  return dm.createDocument({
    organizationId,
    clientId:  meta.client_id ?? currentUserId,
    projectId: meta.project_id,
    name:      meta.name,
    type:      meta.type,
    fileKey,
    fileSize,
    mimeType,
  })
}

export async function getSignedDownloadUrl(document: Document): Promise<string> {
  return getDownloadSignedUrl(document.file_key, document.name)
}

export async function removeDocument(
  id:             string,
  organizationId: string
): Promise<boolean> {
  const doc = await dm.deleteDocument(id, organizationId)
  if (!doc) return false
  await deleteObject(doc.file_key)
  return true
}
