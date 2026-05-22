// infra/cloudflare/workers/og-image/src/index.ts
//
// Hono Worker exposing `GET /og?title=...&subtitle=...&theme=light|dark`
// Returns a 1200x630 PNG. The font (Inter Bold) is shipped as a static
// asset and pinned at module load — Cloudflare Workers cache the ArrayBuffer
// across invocations on the same isolate, so the first request warms up
// satori for everyone behind it.

import { Hono } from 'hono'
import { generateOgImage } from '@pkg/seo'

interface Env {
  ASSETS: { fetch: (req: Request) => Promise<Response> }
  DEFAULT_THEME?: 'light' | 'dark'
}

const app = new Hono<{ Bindings: Env }>()

let cachedFont: ArrayBuffer | null = null

async function loadFont(env: Env): Promise<ArrayBuffer> {
  if (cachedFont) return cachedFont
  const res = await env.ASSETS.fetch(new Request('https://og.local/Inter-Bold.otf'))
  if (!res.ok) {
    throw new Error(`og-image: failed to load font (${res.status})`)
  }
  cachedFont = await res.arrayBuffer()
  return cachedFont
}

app.get('/og', async (c) => {
  const title = c.req.query('title') ?? 'Untitled'
  const subtitle = c.req.query('subtitle')
  const themeParam = c.req.query('theme')
  const theme: 'light' | 'dark' =
    themeParam === 'light' || themeParam === 'dark'
      ? themeParam
      : (c.env.DEFAULT_THEME ?? 'dark')
  const logoUrl = c.req.query('logo') || undefined

  try {
    const font = await loadFont(c.env)
    return await generateOgImage({
      title,
      subtitle,
      theme,
      logoUrl,
      fonts: [{ name: 'Inter', data: font, weight: 700, style: 'normal' }],
    })
  } catch (err) {
    return c.json(
      { error: 'og-image-render-failed', message: (err as Error).message },
      500,
    )
  }
})

app.get('/healthz', (c) => c.text('ok'))

export default app
