/**
 * commitlint — enforces Conventional Commits.
 * https://www.conventionalcommits.org
 */
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'refactor',
        'perf',
        'docs',
        'test',
        'build',
        'ci',
        'chore',
        'revert',
        'style',
      ],
    ],
    'scope-enum': [
      2,
      'always',
      [
        // Apps
        'api-gateway',
        'worker',
        // Packages
        'logger',
        'config',
        'db-client',
        'types',
        // Internal
        'scripts',
        'test-utils',
        'eslint-config',
        'tsconfig',
        // Cross-cutting
        'ci',
        'deps',
        'docs',
        'release',
        'security',
        '*',
      ],
    ],
    'subject-case': [2, 'always', 'sentence-case'],
    'header-max-length': [2, 'always', 100],
    'body-max-line-length': [1, 'always', 120],
  },
}
