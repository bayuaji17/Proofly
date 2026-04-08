import { Hono } from 'hono'
import { validator as zValidator } from 'hono-openapi'
import { authMiddleware } from '../middleware/auth.js'
import { presignUploadSchema } from '../validators/upload.schema.js'
import * as storageService from '../services/storage.service.js'
import crypto from 'node:crypto'

type AuthEnv = {
  Variables: {
    adminId: string
    adminEmail: string
  }
}

const app = new Hono<AuthEnv>()

// All upload routes require authentication
app.use('*', authMiddleware)

// ── POST /presign — Generate presigned upload URL ──
app.post(
  '/presign',
  zValidator('json', presignUploadSchema),
  async (c) => {
    const { filename, content_type, file_size } = c.req.valid('json')

    // Validate file extension against allowed types
    storageService.validateFileExtension(filename)

    // Generate unique object key
    const sanitizedName = filename
      .toLowerCase()
      .replace(/[^a-z0-9.\-_]/g, '-')
      .replace(/-+/g, '-')

    const key = `products/${crypto.randomUUID()}/${Date.now()}-${sanitizedName}`

    // Generate presigned PUT URL
    const uploadUrl = await storageService.getPresignedUploadUrl(
      key,
      content_type,
      file_size
    )

    const publicUrl = storageService.getPublicUrl(key)

    return c.json({
      data: {
        upload_url: uploadUrl,
        public_url: publicUrl,
        key,
      },
    }, 200)
  }
)

export default app
