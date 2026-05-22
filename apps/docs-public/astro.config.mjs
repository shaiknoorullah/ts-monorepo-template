// apps/docs-public/astro.config.mjs
//
// Astro Starlight on Cloudflare Pages. Customer-facing documentation.

import { defineConfig } from 'astro/config'
import cloudflare from '@astrojs/cloudflare'
import starlight from '@astrojs/starlight'

export default defineConfig({
  site: 'https://docs.example.com',
  output: 'static',
  adapter: cloudflare({ mode: 'directory' }),
  integrations: [
    starlight({
      title: 'Example Docs',
      description: 'Documentation for the Example platform.',
      social: [
        { icon: 'github', label: 'GitHub', href: 'https://github.com/example/example' },
      ],
      editLink: {
        baseUrl: 'https://github.com/example/example/edit/main/apps/docs-public/',
      },
      sidebar: [
        {
          label: 'Get started',
          items: [
            { label: 'Introduction', link: '/get-started/introduction/' },
            { label: 'Quickstart', link: '/get-started/quickstart/' },
            { label: 'Concepts', link: '/get-started/concepts/' },
          ],
        },
        {
          label: 'Guides',
          autogenerate: { directory: 'guides' },
        },
        {
          label: 'Reference',
          items: [
            { label: 'API', link: '/reference/api/' },
            { label: 'Webhooks', link: '/reference/webhooks/' },
            { label: 'CLI', link: '/reference/cli/' },
          ],
        },
        {
          label: 'Operations',
          items: [
            { label: 'SLA', link: '/operations/sla/' },
            { label: 'Status page', link: '/operations/status/' },
            { label: 'Support', link: '/operations/support/' },
          ],
        },
      ],
    }),
  ],
})
