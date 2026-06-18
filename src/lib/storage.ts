import { S3Client, DeleteObjectCommand, HeadObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { env } from './env'

export const s3 = new S3Client({
  endpoint:        env.SCALEWAY_ENDPOINT,
  region:          env.SCALEWAY_REGION,
  credentials: {
    accessKeyId:     env.SCALEWAY_ACCESS_KEY,
    secretAccessKey: env.SCALEWAY_SECRET_KEY,
  },
  forcePathStyle: true,
})

export async function getDownloadSignedUrl(key: string, filename: string): Promise<string> {
  const command = new GetObjectCommand({
    Bucket:                     env.SCALEWAY_BUCKET,
    Key:                        key,
    ResponseContentDisposition: `attachment; filename="${encodeURIComponent(filename)}"`,
  })
  return getSignedUrl(s3, command, { expiresIn: 3600 })
}

export async function deleteObject(key: string): Promise<void> {
  await s3.send(new DeleteObjectCommand({ Bucket: env.SCALEWAY_BUCKET, Key: key }))
}

export async function objectExists(key: string): Promise<boolean> {
  try {
    await s3.send(new HeadObjectCommand({ Bucket: env.SCALEWAY_BUCKET, Key: key }))
    return true
  } catch {
    return false
  }
}
