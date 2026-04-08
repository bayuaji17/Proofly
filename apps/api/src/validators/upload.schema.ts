import { z } from 'zod'
import { ALLOWED_IMAGE_TYPES, MAX_UPLOAD_SIZE } from '../constants.js'

export const presignUploadSchema = z.object({
  filename: z.string().min(1, 'Filename is required'),
  content_type: z.enum(ALLOWED_IMAGE_TYPES, {
    message: 'Only JPEG, PNG, and WebP images are allowed',
  }),
  file_size: z
    .number()
    .int()
    .positive()
    .max(MAX_UPLOAD_SIZE, 'File size exceeds 5MB limit'),
})

export type PresignUploadInput = z.infer<typeof presignUploadSchema>
