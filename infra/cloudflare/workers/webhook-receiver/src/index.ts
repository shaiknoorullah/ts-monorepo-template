// infra/cloudflare/workers/webhook-receiver/src/index.ts
//
// Hono on Cloudflare Workers. Receives webhooks at /:source, validates the
// source against an allowlist, and (when Queues is provisioned) enqueues for
// downstream processing.

import { Hono } from 'hono'

interface Env {
  ALLOWED_SOURCES: string
  WEBHOOKS?: Queue
}

interface Queue {
  send: (msg: unknown) => Promise<void>
}

const app = new Hono<{ Bindings: Env }>()

app.post('/:source', async (c) => {
  const source = c.req.param('source')
  const allowed = c.env.ALLOWED_SOURCES.split(',').map((s) => s.trim())
  if (!allowed.includes(source)) {
    return c.text('Unknown source', 404)
  }

  const body = await c.req.text()
  const headers: Record<string, string> = {}
  for (const [k, v] of c.req.raw.headers.entries()) {
    headers[k] = v
  }

  if (c.env.WEBHOOKS) {
    await c.env.WEBHOOKS.send({ body, headers, receivedAt: new Date().toISOString(), source })
  }

  return c.json({ ok: true })
})

app.get('/healthz', (c) => c.text('ok'))

export default app
