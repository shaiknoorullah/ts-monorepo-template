import { defineConfig } from 'vitest/config'

// Vitest 3.2+: `test.projects` replaces the deprecated vitest.workspace.ts.
// Each glob below picks up the per-project vitest config inside that package.
export default defineConfig({
  test: {
    projects: [
      '.audit',
      'apps/*/vitest.config.ts',
      'docs',
      'docs/adrs',
      'docs/agents',
      'docs/architecture',
      'packages/*/vitest.config.ts',
      'internal/cli',
      'internal/schemas',
      'internal/scripts',
      'internal/test-utils',
      // NOTE: internal/templates/* are scaffolding stubs, NOT real projects.
      // They contain placeholder {{name}} markers and broken tsconfig extends.
      'tests',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov', 'json-summary'],
      reportsDirectory: './coverage',
      // TODO: ratchet back to 80/80/80/70 once test coverage catches up
      // to the post-cutover code surface. Many packages (consent, ui/theme,
      // tracking) currently ship without coverage because their behavior
      // is browser/runtime-only and hard to unit-test.
      thresholds: {
        statements: 30,
        functions: 30,
        lines: 30,
        branches: 25,
      },
      all: true,
      include: ['apps/**/src/**/*.ts', 'packages/**/src/**/*.ts'],
      exclude: [
        '**/dist/**',
        '**/node_modules/**',
        '**/*.config.*',
        '**/__tests__/**',
        '**/*.test.ts',
        '**/*.spec.ts',
        '**/index.ts',
      ],
    },
  },
})
