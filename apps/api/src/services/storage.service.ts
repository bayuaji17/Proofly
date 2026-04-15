import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { HTTPException } from 'hono/http-exception'
import path from 'node:path'
import {
  ALLOWED_IMAGE_EXTENSIONS,
  PRESIGN_EXPIRY_SECONDS,
} from '../constants.js'

// ── S3 Client (Cloudflare R2) ──

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID ?? ''
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME ?? ''
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL ?? ''

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID ?? '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? '',
  },
})

// ── Validation ──

export function validateFileExtension(filename: string): void {
  const ext = path.extname(filename).toLowerCase()

  if (!ALLOWED_IMAGE_EXTENSIONS.includes(ext as typeof ALLOWED_IMAGE_EXTENSIONS[number])) {
    throw new HTTPException(400, {
      message: `Invalid file extension "${ext}". Allowed: ${ALLOWED_IMAGE_EXTENSIONS.join(', ')}`,
    })
  }
}

// ── Presigned URL ──

export async function getPresignedUploadUrl(
  key: string,
  contentType: string,
  contentLength: number
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
    ContentType: contentType,
    ContentLength: contentLength,
  })

  return getSignedUrl(s3, command, { expiresIn: PRESIGN_EXPIRY_SECONDS })
}

// ── Public URL ──

export function getPublicUrl(key: string): string {
  return `${R2_PUBLIC_URL}/${key}`
}

// ── Upload Buffer (server-side) ──

export async function uploadBuffer(
  key: string,
  buffer: Buffer,
  contentType: string
): Promise<void> {
  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: contentType,
    ContentLength: buffer.length,
  })

  await s3.send(command)
}

// ── Delete ──

export async function deleteObject(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
  })

  await s3.send(command)
}

// ── Helpers ──

export function extractKeyFromUrl(url: string): string | null {
  if (!R2_PUBLIC_URL || !url.startsWith(R2_PUBLIC_URL)) return null
  return url.slice(R2_PUBLIC_URL.length + 1) // remove trailing slash
}
