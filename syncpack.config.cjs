/**
 * Syncpack — keep workspace dependency versions in sync.
 * See https://jamiemason.github.io/syncpack/
 */
module.exports = {
  versionGroups: [
    {
      label: 'Internal workspace packages always use workspace:*',
      packages: ['**'],
      dependencies: ['@app/**', '@pkg/**', '@internal/**'],
      pinVersion: 'workspace:*',
    },
    {
      label: 'Pin runtime deps from pnpm catalog',
      dependencies: [
        'fastify',
        '@fastify/cors',
        '@fastify/helmet',
        'drizzle-orm',
        'bullmq',
        'ioredis',
      ],
      pinVersion: 'catalog:runtime',
    },
    {
      label: 'Pin testing deps from pnpm catalog',
      dependencies: ['@testcontainers/postgresql', 'msw', '@faker-js/faker'],
      pinVersion: 'catalog:testing',
    },
    {
      // pnpm.overrides are intentionally exact pins — the whole point of an
      // override is to force every package in the workspace onto one resolved
      // copy (needed for ajv + ajv-formats so `Ajv2020` and `ajv-formats`'s
      // peer-injected Plugin<Opts> reference the same TypeScript type).
      // Carets here would defeat the override.
      label: 'Allow exact-pin in pnpm.overrides',
      dependencyTypes: ['pnpmOverrides'],
      dependencies: ['**'],
      packages: ['**'],
      isIgnored: true,
    },
  ],
  semverGroups: [
    {
      label: 'Use ^ for everything else',
      range: '^',
      dependencies: ['**'],
      packages: ['**'],
      dependencyTypes: ['dev', 'prod', 'peer', 'optional'],
    },
  ],
  sortPackages: true,
  sortFirst: [
    'name',
    'version',
    'private',
    'description',
    'keywords',
    'homepage',
    'repository',
    'bugs',
    'license',
    'author',
    'type',
    'main',
    'module',
    'types',
    'exports',
    'files',
    'scripts',
    'dependencies',
    'devDependencies',
    'peerDependencies',
  ],
  sortAz: ['contributors', 'dependencies', 'devDependencies', 'peerDependencies', 'keywords'],
  source: [
    'package.json',
    'apps/*/package.json',
    'packages/*/package.json',
    'internal/*/package.json',
  ],
}
