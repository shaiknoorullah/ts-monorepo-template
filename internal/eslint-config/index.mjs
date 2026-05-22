/**
 * Shared ESLint flat config preset.
 *
 * Re-exported by the workspace root `eslint.config.mjs` so the same baseline
 * applies everywhere. Per-package overrides go in each package's own config.
 */

export const baseRules = {
  // TypeScript surface
  '@typescript-eslint/explicit-module-boundary-types': 'error',
  '@typescript-eslint/no-explicit-any': 'error',
  '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
  '@typescript-eslint/consistent-type-imports': ['error', { fixStyle: 'inline-type-imports' }],

  // Imports
  'import-x/no-cycle': ['error', { maxDepth: 10 }],
  'import-x/no-self-import': 'error',

  // Noise / hygiene
  'no-console': ['error', { allow: ['warn', 'error'] }],
  'no-warning-comments': ['warn', { terms: ['FIXME', 'XXX'], location: 'anywhere' }],

  // Soft sonar rules
  'sonarjs/no-duplicate-string': ['warn', { threshold: 5 }],

  // Disable opinionated plugin defaults that fight TypeScript
  'unicorn/prevent-abbreviations': 'off',
  'unicorn/no-null': 'off',
  'unicorn/prefer-module': 'off',
}

export const testFileOverrides = {
  files: ['**/*.{test,spec}.ts', '**/__tests__/**/*.ts'],
  rules: {
    '@typescript-eslint/no-explicit-any': 'off',
    'sonarjs/no-duplicate-string': 'off',
  },
}
