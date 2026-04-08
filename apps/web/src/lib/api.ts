import { API_BASE_URL } from './constants'
import { authStore } from './auth-store'
import { toast } from '#/components/ui/toast'

/* ------------------------------------------------------------------ */
/*  ApiError                                                          */
/* ------------------------------------------------------------------ */

export class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    message: string,
    public data?: unknown,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

/* ------------------------------------------------------------------ */
/*  ApiClient                                                         */
/* ------------------------------------------------------------------ */

interface RequestOptions extends Omit<RequestInit, 'body'> {
  /** Skip attaching the Authorization header (used internally). */
  skipAuth?: boolean
}

class ApiClient {
  private baseUrl: string
  private refreshPromise: Promise<boolean> | null = null

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  /* ---- core request ---- */

  private async request<T>(
    endpoint: string,
    options?: RequestOptions & { body?: unknown },
  ): Promise<T> {
    const token = authStore.getToken()

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(token && !options?.skipAuth && {
        Authorization: `Bearer ${token}`,
      }),
      ...options?.headers,
    }

    const fetchOptions: RequestInit = {
      ...options,
      headers,
      credentials: 'include', // send HttpOnly cookies
      body: options?.body ? JSON.stringify(options.body) : undefined,
    }

    const response = await fetch(
      `${this.baseUrl}${endpoint}`,
      fetchOptions,
    )

    // Auto-refresh on 401 (skip if this was already an auth-skip call)
    if (response.status === 401 && !options?.skipAuth) {
      const refreshed = await this.tryRefresh()

      if (refreshed) {
        // Retry original request with fresh token
        return this.request<T>(endpoint, options)
      }

      // Refresh also failed — redirect to login
      authStore.clear()
      toast.info('Sesi berakhir, silakan login kembali')
      window.location.href = '/login'
      throw new ApiError(401, 'Unauthorized', 'Session expired')
    }

    if (!response.ok) {
      const data = await response.json().catch(() => null)
      const errorData = data as { message?: string } | null
      throw new ApiError(
        response.status,
        response.statusText,
        errorData?.message || 'Request failed',
        data,
      )
    }

    if (response.status === 204) return undefined as T

    return response.json() as Promise<T>
  }

  /* ---- token refresh (deduplicated) ---- */

  private async tryRefresh(): Promise<boolean> {
    // If a refresh is already in-flight, wait for that one instead of
    // firing a second request.
    if (this.refreshPromise) {
      return this.refreshPromise
    }

    this.refreshPromise = this.executeRefresh()

    try {
      return await this.refreshPromise
    } finally {
      this.refreshPromise = null
    }
  }

  private async executeRefresh(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/auth/refresh`, {
        method: 'POST',
        credentials: 'include', // send refresh-token cookie
      })

      if (!response.ok) return false

      const json = (await response.json()) as {
        data: { access_token: string }
      }

      authStore.setToken(json.data.access_token)
      return true
    } catch {
      return false
    }
  }

  /* ---- public HTTP methods ---- */

  async get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' })
  }

  async post<T>(
    endpoint: string,
    body?: unknown,
    options?: RequestOptions,
  ): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'POST', body })
  }

  async put<T>(
    endpoint: string,
    body: unknown,
    options?: RequestOptions,
  ): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'PUT', body })
  }

  async patch<T>(
    endpoint: string,
    body?: unknown,
    options?: RequestOptions,
  ): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'PATCH', body })
  }

  async delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' })
  }
}

/* ------------------------------------------------------------------ */
/*  Singleton instance                                                */
/* ------------------------------------------------------------------ */

export const api = new ApiClient(API_BASE_URL)
