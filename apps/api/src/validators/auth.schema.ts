import { z } from 'zod'
import 'zod-openapi/extend'

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
}).openapi({
  ref: 'LoginInput',
  description: 'Authentication input to login'
})

export const loginResponseSchema = z.object({
  data: z.object({
    access_token: z.string(),
    admin: z.object({
      id: z.string().uuid(),
      email: z.string().email()
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
    id: z.string().uuid(),
    email: z.string().email()
  })
}).openapi({ ref: 'MeResponse' })

export type LoginInput = z.infer<typeof loginSchema>
