import { defineConfig } from 'tsdown'

export default defineConfig({
  clean: true,
  dts: true,
  entry: ['src/index.ts'],
  external: ['drizzle-orm', '@pkg/types'],
  format: ['esm', 'cjs'],
  sourcemap: true,
  target: 'node22',
})
