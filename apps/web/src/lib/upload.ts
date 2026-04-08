import { api } from '#/lib/api'
import type { PresignResponse } from '#/types/models'

const MAX_UPLOAD_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp']
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp']

/* ------------------------------------------------------------------ */
/*  Client-side validation                                             */
/* ------------------------------------------------------------------ */

export function validateImageFile(file: File): string | null {
  const ext = `.${file.name.split('.').pop()?.toLowerCase() ?? ''}`

  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return `Format file tidak didukung. Gunakan: ${ALLOWED_EXTENSIONS.join(', ')}`
  }

  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return 'Tipe file tidak valid. Hanya JPEG, PNG, dan WebP yang diizinkan.'
  }

  if (file.size > MAX_UPLOAD_SIZE) {
    return `Ukuran file terlalu besar. Maksimal ${MAX_UPLOAD_SIZE / 1024 / 1024}MB.`
  }

  return null
}

/* ------------------------------------------------------------------ */
/*  Upload to R2 via presigned URL                                     */
/* ------------------------------------------------------------------ */

export async function uploadProductPhoto(file: File): Promise<string> {
  // 1. Get presigned URL from backend
  const presign = await api.post<PresignResponse>('/api/upload/presign', {
    filename: file.name,
    content_type: file.type,
    file_size: file.size,
  })

  // 2. Upload directly to R2 (no auth header, raw file body)
  const uploadRes = await fetch(presign.data.upload_url, {
    method: 'PUT',
    headers: {
      'Content-Type': file.type,
    },
    body: file,
  })

  if (!uploadRes.ok) {
    throw new Error(`Upload gagal: ${uploadRes.status} ${uploadRes.statusText}`)
  }

  // 3. Return public URL
  return presign.data.public_url
}
