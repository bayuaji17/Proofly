import { z } from 'zod'
import 'zod-openapi/extend'

export const loginSchema = z.object({
  email: z.email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
}).openapi({
  ref: 'LoginInput',
  description: 'Authentication input to login'
})

export const loginResponseSchema = z.object({
  data: z.object({
    access_token: z.string(),
    admin: z.object({
      id: z.uuid(),
      email: z.email()
    })
  })
}).openapi({ ref: 'LoginResponse' })

export const refreshResponseSchema = z.object({
  data: z.object({
    access_token: z.string()
  })
}).openapi({ ref: 'RefreshResponse' })

export const meResponseSchema = z.object({
  data: z.object({
    id: z.uuid(),
    email: z.email()
  })
}).openapi({ ref: 'MeResponse' })

export const logoutResponseSchema = z.object({
  success: z.boolean(),
  message: z.string()
}).openapi({ ref: 'LogoutResponse' })

export type LoginInput = z.infer<typeof loginSchema>

export const refreshTokenCookieSchema = z.object({
  proofly_refresh_token: z.string().optional()
}).openapi({ ref: 'RefreshTokenCookie' })
