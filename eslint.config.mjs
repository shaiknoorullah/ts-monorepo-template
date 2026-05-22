// ESLint 9 flat config — see https://eslint.org/docs/latest/use/configure/configuration-files
import tseslint from 'typescript-eslint'
import unicorn from 'eslint-plugin-unicorn'
import sonar from 'eslint-plugin-sonarjs'
import perfectionist from 'eslint-plugin-perfectionist'
import importX from 'eslint-plugin-import-x'
import promise from 'eslint-plugin-promise'
import security from 'eslint-plugin-security'
import vitest from '@vitest/eslint-plugin'

export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/coverage/**',
      '**/.nx/**',
      '**/node_modules/**',
      '**/*.tsbuildinfo',
      'docs/.vitepress/cache/**',
      'docs/.vitepress/dist/**',
    ],
  },

  // TypeScript — strict + stylistic, type-checked
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,

  // Plugins
  unicorn.configs.recommended,
  sonar.configs.recommended,
  perfectionist.configs['recommended-natural'],
  importX.flatConfigs.recommended,
  importX.flatConfigs.typescript,
  promise.configs['flat/recommended'],
  security.configs.recommended,

  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // Project-wide tuning
      'unicorn/prevent-abbreviations': 'off',
      'unicorn/no-null': 'off',
      'unicorn/prefer-top-level-await': 'off',
      'sonarjs/no-duplicate-string': ['warn', { threshold: 5 }],
      'sonarjs/cognitive-complexity': ['warn', 15],
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'separate-type-imports' },
      ],
      'import-x/no-cycle': 'error',
      'import-x/no-self-import': 'error',
      // AGENT-TODO marker discipline
      'no-warning-comments': [
        'warn',
        { terms: ['fixme', 'xxx'], location: 'start' },
      ],
    },
  },

  // Test files — relax a few rules
  {
    files: ['**/*.{test,spec}.ts', '**/__tests__/**/*.ts'],
    plugins: { vitest },
    rules: {
      ...vitest.configs.recommended.rules,
      '@typescript-eslint/no-non-null-assertion': 'off',
      'sonarjs/no-duplicate-string': 'off',
      'security/detect-object-injection': 'off',
    },
  },

  // Config files — disable type-checked rules (these aren't in tsconfig project)
  {
    files: ['**/*.config.{ts,mts,mjs,cjs,js}', '**/*.config.*.ts'],
    ...tseslint.configs.disableTypeChecked,
  },
)
