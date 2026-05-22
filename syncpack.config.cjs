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
      dependencies: ['fastify', '@fastify/cors', '@fastify/helmet', 'drizzle-orm', 'bullmq', 'ioredis'],
      pinVersion: 'catalog:runtime',
    },
    {
      label: 'Pin testing deps from pnpm catalog',
      dependencies: ['@testcontainers/postgresql', 'msw', '@faker-js/faker'],
      pinVersion: 'catalog:testing',
    },
  ],
  semverGroups: [
    {
      label: 'Use ^ for everything else',
      range: '^',
      dependencies: ['**'],
      packages: ['**'],
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
  source: ['package.json', 'apps/*/package.json', 'packages/*/package.json', 'internal/*/package.json'],
}
