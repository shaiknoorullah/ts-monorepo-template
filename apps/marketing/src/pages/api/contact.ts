// apps/marketing/src/pages/api/contact.ts
//
// Contact form endpoint. Validates with Zod, verifies Turnstile, persists to D1.

import type { APIContext } from 'astro'
import { z } from 'zod'

export const prerender = false

const ContactSchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email(),
  message: z.string().min(10).max(5000),
  turnstileToken: z.string().min(1),
})

interface CFEnv {
  TURNSTILE_SECRET_KEY?: string
  FORMS_DB?: D1Database
}

// Minimal D1 typing — real binding comes from wrangler types.
interface D1Database {
  prepare(query: string): {
    bind: (...params: unknown[]) => {
      run: () => Promise<{ success: boolean }>
    }
  }
}

async function verifyTurnstile(token: string, secret: string, remoteIp?: string): Promise<boolean> {
  const body = new FormData()
  body.append('secret', secret)
  body.append('response', token)
  if (remoteIp) body.append('remoteip', remoteIp)
  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body,
  })
  const data = (await res.json()) as { success: boolean }
  return data.success === true
}

export async function POST(ctx: APIContext): Promise<Response> {
  const env = (ctx.locals as { runtime?: { env: CFEnv } }).runtime?.env ?? {}
  let payload: unknown
  try {
    payload = await ctx.request.json()
  } catch {
    return new Response('Invalid JSON', { status: 400 })
  }

  const parsed = ContactSchema.safeParse(payload)
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: 'validation', issues: parsed.error.issues }), {
      status: 422,
      headers: { 'content-type': 'application/json' },
    })
  }

  const { turnstileToken, ...lead } = parsed.data
  const remoteIp = ctx.request.headers.get('cf-connecting-ip') ?? undefined

  if (env.TURNSTILE_SECRET_KEY) {
    const ok = await verifyTurnstile(turnstileToken, env.TURNSTILE_SECRET_KEY, remoteIp)
    if (!ok) return new Response('Captcha failed', { status: 403 })
  }

  if (env.FORMS_DB) {
    await env.FORMS_DB.prepare(
      'INSERT INTO contact_submissions (name, email, message, ip, created_at) VALUES (?, ?, ?, ?, ?)',
    )
      .bind(lead.name, lead.email, lead.message, remoteIp ?? null, new Date().toISOString())
      .run()
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  })
}
