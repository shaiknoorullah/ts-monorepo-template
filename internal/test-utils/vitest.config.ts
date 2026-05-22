// @ts-expect-error — config alias resolver is a plain .mjs helper
import { workspaceAliases } from '../../config/vitest-workspace-aliases.mjs'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: workspaceAliases(),
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    name: '@internal/test-utils',
    // This package is helpers-only — having zero tests is fine.
    passWithNoTests: true,
  },
})
