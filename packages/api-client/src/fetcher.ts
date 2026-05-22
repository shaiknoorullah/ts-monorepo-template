// packages/api-client/src/fetcher.ts
//
// Typed fetch wrapper. Auth + tenancy headers are injected automatically.

export interface ApiClient {
  delete: <T>(path: string) => Promise<T>
  get: <T>(path: string) => Promise<T>
  post: <T>(path: string, body: unknown) => Promise<T>
  put: <T>(path: string, body: unknown) => Promise<T>
}

export interface ApiClientOptions {
  baseUrl: string
  getAuthToken?: () => null | Promise<null | string> | string
  getTenantSlug?: () => null | string
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public body: string,
  ) {
    super(`HTTP ${status}: ${body}`)
    this.name = 'ApiError'
  }
}

export function createApiClient(opts: ApiClientOptions): ApiClient {
  const base = opts.baseUrl.replace(/\/$/, '')

  async function buildHeaders(extra?: Record<string, string>): Promise<HeadersInit> {
    const headers: Record<string, string> = {
      'content-type': 'application/json',
      ...extra,
    }
    const token = opts.getAuthToken ? await opts.getAuthToken() : null
    if (token) headers.authorization = `Bearer ${token}`
    const slug = opts.getTenantSlug?.() ?? null
    if (slug) headers['x-tenant'] = slug
    return headers
  }

  async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const res = await fetch(`${base}${path}`, {
      body: body == null ? undefined : JSON.stringify(body),
      credentials: 'include',
      headers: await buildHeaders(),
      method,
    })
    if (!res.ok) throw new ApiError(res.status, await res.text())
    if (res.status === 204) return undefined as T
    return (await res.json()) as T
  }

  return {
    delete: <T>(p: string) => request<T>('DELETE', p),
    get: <T>(p: string) => request<T>('GET', p),
    post: <T>(p: string, b: unknown) => request<T>('POST', p, b),
    put: <T>(p: string, b: unknown) => request<T>('PUT', p, b),
  }
}
