import { defineConfig } from 'astro/config'
import cloudflare from '@astrojs/cloudflare'
import starlight from '@astrojs/starlight'

export default defineConfig({
  output: 'static',
  adapter: cloudflare({ mode: 'directory' }),
  integrations: [
    starlight({
      title: '{{name}}',
      sidebar: [{ label: 'Start', items: [{ label: 'Welcome', link: '/welcome/' }] }],
    }),
  ],
})
