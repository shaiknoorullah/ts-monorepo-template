// infra/cloudflare/workers/tenant-router/src/index.ts
//
// Routes `<tenant>.app.example.com` to the web-app Pages origin with an
// `x-tenant: <slug>` header. Validates the slug against tenancy-client rules.

import { resolveTenantFromHostname } from '@pkg/tenancy-client'

export interface Env {
  ROOT_DOMAIN: string
  WEB_APP_ORIGIN: string
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    const slug = resolveTenantFromHostname(url.hostname, env.ROOT_DOMAIN)
    if (!slug) {
      return new Response('Tenant not found', { status: 404 })
    }

    const upstream = new URL(env.WEB_APP_ORIGIN)
    upstream.pathname = url.pathname
    upstream.search = url.search

    const headers = new Headers(request.headers)
    headers.set('x-tenant', slug)

    const upstreamReq = new Request(upstream.toString(), {
      method: request.method,
      headers,
      body: request.body,
      redirect: 'manual',
    })

    return fetch(upstreamReq)
  },
}
