import { defineConfig } from 'tsdown'

export default defineConfig({
  clean: true,
  dts: false,
  entry: ['src/main.ts'],
  external: ['bullmq', 'ioredis', 'pino', 'zod'],
  format: ['esm'],
  sourcemap: true,
  target: 'node22',
})
