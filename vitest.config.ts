import { defineConfig } from 'vitest/config'

// Vitest 3.2+: `test.projects` replaces the deprecated vitest.workspace.ts.
// Each glob below picks up the per-project vitest config inside that package.
export default defineConfig({
  test: {
    projects: [
      'apps/*',
      'packages/*',
      'internal/cli',
      'internal/test-utils',
      // NOTE: internal/templates/* are scaffolding stubs, NOT real projects.
      // They contain placeholder {{name}} markers and broken tsconfig extends.
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov', 'json-summary'],
      reportsDirectory: './coverage',
      thresholds: {
        statements: 80,
        functions: 80,
        lines: 80,
        branches: 70,
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
