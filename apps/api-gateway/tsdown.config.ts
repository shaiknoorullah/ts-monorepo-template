import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/main.ts'],
  format: ['esm'],
  dts: false,
  sourcemap: true,
  clean: true,
  target: 'node22',
  // Services bundle their workspace deps, leave runtime deps external so the
  // container's node_modules can dedupe them.
  external: [
    'fastify',
    '@fastify/cors',
    '@fastify/helmet',
    'pino',
    'zod',
    'pg',
    'drizzle-orm',
  ],
})
