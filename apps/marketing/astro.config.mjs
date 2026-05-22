// apps/marketing/astro.config.mjs
//
// Astro 5 on Cloudflare Pages. SSR mode = 'directory' allows server islands
// while keeping per-page output static where possible.

import mdx from '@astrojs/mdx'
import sitemap from '@astrojs/sitemap'
import { defineConfig } from 'astro/config'

const SITE = process.env.SITE_URL ?? 'https://www.example.com'

// NOTE: @astrojs/cloudflare adapter requires `output: 'server'` — removed here
// because this site is static. Re-add (with `output: 'server'`) only when
// server islands actually need runtime behavior.
export default defineConfig({
  image: {
    domains: ['images.example.com'],
  },
  integrations: [mdx(), sitemap()],
  output: 'static',
  site: SITE,
  // serverIslands is stable in Astro 5; no experimental flag required.
  vite: {
    // Tamagui requires Babel preset; configured via vite-plugin in apps that
    // mount React islands. Marketing keeps React islands tiny — pure Astro
    // components otherwise.
  },
})
