// apps/marketing/astro.config.mjs
//
// Astro 5 on Cloudflare Pages. SSR mode = 'directory' allows server islands
// while keeping per-page output static where possible.

import { defineConfig } from 'astro/config'
import cloudflare from '@astrojs/cloudflare'
import mdx from '@astrojs/mdx'
import sitemap from '@astrojs/sitemap'

const SITE = process.env.SITE_URL ?? 'https://www.example.com'

export default defineConfig({
  site: SITE,
  output: 'static',
  adapter: cloudflare({
    mode: 'directory',
    imageService: 'cloudflare',
  }),
  integrations: [mdx(), sitemap()],
  image: {
    domains: ['images.example.com'],
  },
  experimental: {
    // Enable server islands for personalized fragments.
    serverIslands: true,
  },
  vite: {
    // Tamagui requires Babel preset; configured via vite-plugin in apps that
    // mount React islands. Marketing keeps React islands tiny — pure Astro
    // components otherwise.
  },
})
