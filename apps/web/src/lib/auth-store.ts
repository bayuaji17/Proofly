/**
 * In-memory auth token store.
 *
 * Access token is stored in a module-level variable — NOT in localStorage.
 * This is intentional: it protects against XSS while still being accessible
 * from non-React code (api client, router guards).
 *
 * On page refresh the token is lost, which is handled by calling
 * POST /api/auth/refresh (the HttpOnly refresh-token cookie is sent
 * automatically by the browser).
 */

let accessToken: string | null = null

export const authStore = {
  getToken: (): string | null => accessToken,

  setToken: (token: string | null): void => {
    accessToken = token
  },

  clear: (): void => {
    accessToken = null
  },
}
