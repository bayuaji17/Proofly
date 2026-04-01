import { ErrorHandler } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { errorResponse } from '../utils/response.js'

export const errorHandler: ErrorHandler = (err, c) => {
  if (err instanceof HTTPException) {
    return c.json(errorResponse(err.message, err.status), err.status)
  }
  
  console.error('Unhandled ERROR:', err)
  // Need to cast to any 500 status to comply with hono StatusCode
  return c.json(errorResponse('Internal Server Error', 500), 500 as any)
}
