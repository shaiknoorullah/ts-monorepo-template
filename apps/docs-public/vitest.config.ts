// @ts-expect-error — config alias resolver is a plain .mjs helper
import { workspaceAliases } from '../../config/vitest-workspace-aliases.mjs'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: workspaceAliases(),
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', '__tests__/**/*.test.ts'],
    name: '@app/docs-public',
  },
})
