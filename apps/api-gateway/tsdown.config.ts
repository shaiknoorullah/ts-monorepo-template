import { defineConfig } from 'tsdown'

export default defineConfig({
  clean: true,
  dts: false,
  entry: ['src/main.ts'],
  // Services bundle their workspace deps, leave runtime deps external so the
  // container's node_modules can dedupe them.
  external: ['fastify', '@fastify/cors', '@fastify/helmet', 'pino', 'zod', 'pg', 'drizzle-orm'],
  format: ['esm'],
  sourcemap: true,
  target: 'node22',
})
