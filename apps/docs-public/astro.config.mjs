// apps/docs-public/astro.config.mjs
//
// Astro Starlight on Cloudflare Pages. Customer-facing documentation.

import starlight from '@astrojs/starlight'
import { defineConfig } from 'astro/config'

// NOTE: @astrojs/cloudflare adapter requires `output: 'server'` — removed
// because docs are static. Cloudflare Pages serves them directly.
export default defineConfig({
  integrations: [
    starlight({
      description: 'Documentation for the Example platform.',
      editLink: {
        baseUrl: 'https://github.com/example/example/edit/main/apps/docs-public/',
      },
      sidebar: [
        {
          items: [
            { label: 'Introduction', link: '/get-started/introduction/' },
            { label: 'Quickstart', link: '/get-started/quickstart/' },
            { label: 'Concepts', link: '/get-started/concepts/' },
          ],
          label: 'Get started',
        },
        {
          autogenerate: { directory: 'guides' },
          label: 'Guides',
        },
        {
          items: [
            { label: 'API', link: '/reference/api/' },
            { label: 'Webhooks', link: '/reference/webhooks/' },
            { label: 'CLI', link: '/reference/cli/' },
          ],
          label: 'Reference',
        },
        // Phase 16 — generated reference pages (per layer / XRD / app / profile / verb).
        // Source: apps/docs-public/scripts/generate-references.ts. Re-run via
        // `task docs:gen` (CI asserts no drift, spec Section 15.4).
        {
          autogenerate: { directory: 'reference/layers' },
          label: 'Layers',
        },
        {
          autogenerate: { directory: 'reference/verbs' },
          collapsed: true,
          label: 'Verbs (Taskfile)',
        },
        {
          autogenerate: { directory: 'reference/xrds' },
          collapsed: true,
          label: 'XRDs',
        },
        {
          autogenerate: { directory: 'reference/apps' },
          collapsed: true,
          label: 'App charts',
        },
        {
          autogenerate: { directory: 'reference/profiles' },
          label: 'Profiles',
        },
        {
          items: [
            { label: 'SLA', link: '/operations/sla/' },
            { label: 'Status page', link: '/operations/status/' },
            { label: 'Support', link: '/operations/support/' },
          ],
          label: 'Operations',
        },
      ],
      social: {
        github: 'https://github.com/example/example',
      },
      title: 'Example Docs',
    }),
  ],
  output: 'static',
  site: 'https://docs.example.com',
})
