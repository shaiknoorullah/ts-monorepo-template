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
      '**/.next/**',
      '**/.astro/**',
      '**/.expo/**',
      '**/.wrangler/**',
      '**/node_modules/**',
      '**/*.tsbuildinfo',
      'docs/.vitepress/cache/**',
      'docs/.vitepress/dist/**',
      'internal/templates/**',
      // Generated proto bindings — buf manages these; linting them only generates noise.
      'packages/contracts/gen/**',
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
      'unicorn/prefer-module': 'off', // TODO: re-enable when all CJS configs are migrated
      'unicorn/no-anonymous-default-export': 'off', // TODO: re-enable; legacy Babel/Tailwind configs
      'unicorn/filename-case': 'off', // TODO: enforce kebab-case once existing PascalCase files are renamed
      'unicorn/text-encoding-identifier-case': 'off', // TODO: re-enable
      'unicorn/no-process-exit': 'off', // CLI tooling needs it
      'unicorn/no-nested-ternary': 'off', // conflicts with prettier's auto-reformatting
      'sonarjs/no-duplicate-string': ['warn', { threshold: 5 }],
      'sonarjs/cognitive-complexity': ['warn', 15],
      'sonarjs/deprecation': 'warn', // TODO: surface as warning until migration is done
      'sonarjs/prefer-read-only-props': 'off',
      'sonarjs/different-types-comparison': 'off',
      'sonarjs/todo-tag': 'off',
      'sonarjs/no-nested-template-literals': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/consistent-type-imports': [
        'warn', // TODO: bump to error once auto-fix sweep is merged
        { prefer: 'type-imports', fixStyle: 'separate-type-imports' },
      ],
      '@typescript-eslint/restrict-template-expressions': 'off', // TODO: tighten
      '@typescript-eslint/no-unnecessary-type-conversion': 'warn',
      '@typescript-eslint/no-deprecated': 'warn',
      '@typescript-eslint/no-unsafe-assignment': 'warn',
      '@typescript-eslint/no-unsafe-member-access': 'warn',
      '@typescript-eslint/no-unsafe-call': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',
      '@typescript-eslint/no-unsafe-return': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-non-null-assertion': 'warn',
      '@typescript-eslint/no-unnecessary-condition': 'warn',
      '@typescript-eslint/no-unnecessary-type-parameters': 'off',
      '@typescript-eslint/require-await': 'warn',
      // import-x: the typescript resolver is currently broken under flat config
      // (loads as "invalid interface"); disable resolver-dependent rules globally.
      // TODO: re-enable once eslint-plugin-import-x ships a working flat resolver.
      'import-x/no-unresolved': 'off',
      'import-x/namespace': 'off',
      'import-x/default': 'off',
      'import-x/no-named-as-default': 'off',
      'import-x/no-named-as-default-member': 'off',
      'import-x/no-duplicates': 'off',
      'import-x/no-cycle': 'off', // resolver-dependent
      'import-x/no-self-import': 'off', // resolver-dependent
      // perfectionist: too noisy and not load-bearing; reformatting-only churn
      // TODO: re-enable selectively (sort-imports + sort-named-imports) once team aligns
      'perfectionist/sort-objects': 'off',
      'perfectionist/sort-imports': 'off',
      'perfectionist/sort-modules': 'off',
      'perfectionist/sort-classes': 'off',
      'perfectionist/sort-interfaces': 'off',
      'perfectionist/sort-object-types': 'off',
      'perfectionist/sort-union-types': 'off',
      'perfectionist/sort-intersection-types': 'off',
      'perfectionist/sort-enums': 'off',
      'perfectionist/sort-jsx-props': 'off',
      'perfectionist/sort-named-imports': 'off',
      'perfectionist/sort-named-exports': 'off',
      'perfectionist/sort-exports': 'off',
      // Misc spot-warnings — turn into warnings so they don't fail CI
      'unicorn/catch-error-name': 'warn',
      'unicorn/no-useless-undefined': 'warn',
      '@typescript-eslint/array-type': 'warn',
      '@typescript-eslint/no-empty-object-type': 'warn',
      '@typescript-eslint/no-empty-interface': 'warn',
      '@typescript-eslint/no-unsafe-function-type': 'warn',
      // AGENT-TODO marker discipline
      'no-warning-comments': ['warn', { terms: ['fixme', 'xxx'], location: 'start' }],
    },
  },

  // Blanket noise reduction — turn remaining sonarjs/unicorn/ts noise into
  // warnings. Placed BEFORE test/config blocks so those can override and
  // disable type-aware rules outside the project graph.
  // TODO: tighten these per-package once codebase stabilises.
  {
    rules: {
      'sonarjs/no-redundant-optional': 'warn',
      'sonarjs/no-nested-conditional': 'warn',
      'sonarjs/function-return-type': 'off',
      'sonarjs/void-use': 'warn',
      'sonarjs/redundant-type-aliases': 'warn',
      'sonarjs/no-useless-intersection': 'warn',
      'sonarjs/slow-regex': 'warn',
      'sonarjs/pseudo-random': 'warn',
      'sonarjs/concise-regex': 'warn',
      'unicorn/no-array-for-each': 'warn',
      'unicorn/import-style': 'warn',
      'unicorn/consistent-function-scoping': 'warn',
      '@typescript-eslint/unified-signatures': 'warn',
      '@typescript-eslint/triple-slash-reference': 'warn',
      '@typescript-eslint/no-require-imports': 'warn',
      '@typescript-eslint/no-base-to-string': 'warn',
      '@typescript-eslint/prefer-nullish-coalescing': 'warn',
      '@typescript-eslint/no-empty-function': 'warn',
    },
  },

  // Test files — disable type-checked AND parser project (tests live
  // outside the typed-project graph; ESLint project-service can't find them)
  {
    files: [
      '**/*.{test,spec}.{ts,tsx}',
      '**/__tests__/**/*.{ts,tsx}',
      '**/*.{test,spec}.{js,mjs,cjs}',
    ],
    languageOptions: {
      parserOptions: {
        projectService: false,
        project: null,
      },
    },
    plugins: { vitest },
    rules: {
      ...tseslint.configs.disableTypeChecked.rules,
      ...vitest.configs.recommended.rules,
      '@typescript-eslint/no-non-null-assertion': 'off',
      'sonarjs/no-duplicate-string': 'off',
      'security/detect-object-injection': 'off',
      // Test-only relaxations
      'vitest/no-conditional-expect': 'warn',
      'vitest/expect-expect': 'warn',
      'unicorn/no-useless-undefined': 'off',
      'unicorn/catch-error-name': 'off',
      '@typescript-eslint/array-type': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/no-empty-interface': 'off',
      '@typescript-eslint/no-unsafe-function-type': 'off',
    },
  },

  // Config + plain .mjs/.cjs files — disable type-checked rules
  // (these aren't in tsconfig project).
  {
    files: [
      '**/*.config.{ts,mts,mjs,cjs,js}',
      '**/*.config.*.ts',
      '**/babel.config.{js,cjs,mjs}',
      '**/metro.config.{js,cjs,mjs}',
      '**/tailwind.config.{js,cjs,mjs,ts}',
      '**/postcss.config.{js,cjs,mjs}',
      '**/jest.config.{js,cjs,mjs,ts}',
      '**/.eslintrc.{js,cjs,mjs}',
      '**/*.{mjs,cjs}',
      'config/**/*.ts',
    ],
    languageOptions: {
      parserOptions: {
        projectService: false,
        project: null,
      },
    },
    rules: {
      ...tseslint.configs.disableTypeChecked.rules,
    },
  },
)
