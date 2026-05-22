import { defineConfig } from 'astro/config'
import cloudflare from '@astrojs/cloudflare'
import sitemap from '@astrojs/sitemap'

export default defineConfig({
  site: 'https://www.example.com',
  output: 'static',
  adapter: cloudflare({ mode: 'directory' }),
  integrations: [sitemap()],
})
