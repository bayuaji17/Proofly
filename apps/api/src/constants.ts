export const MAX_SCAN_LIMIT = 3
export const SERIAL_NUMBER_CHARSET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'

// Upload
export const MAX_UPLOAD_SIZE = 5 * 1024 * 1024 // 5MB
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const
export const ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'] as const
export const PRESIGN_EXPIRY_SECONDS = 600 // 10 minutes
