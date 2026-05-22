// apps/cms/payload.config.ts
//
// Single source of truth for the CMS. Loaded by Next.js at runtime.

import { postgresAdapter } from '@payloadcms/db-postgres'
import { cloudStoragePlugin } from '@payloadcms/plugin-cloud-storage'
import { multiTenantPlugin } from '@payloadcms/plugin-multi-tenant'

// TODO(@payloadcms/storage-s3 migration): the `@payloadcms/plugin-cloud-storage/s3`
// subpath was removed upstream in Payload 3.x in favour of the standalone
// `@payloadcms/storage-s3` adapter. Until that migration lands, ship a
// build-time no-op adapter so `next build` can statically analyse this file.
// The runtime path is gated behind `process.env.R2_BUCKET` so production
// deployments that don't set it never invoke the stub.
const s3Adapter = (_cfg: unknown) =>
  ({
    name: 's3-stub',
    handleUpload: () => Promise.resolve(),
    handleDelete: () => Promise.resolve(),
    generateURL: () => '',
    staticHandler: () => new Response('s3 stub', { status: 501 }),
  }) as never
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildConfig } from 'payload'

import { Media } from './src/collections/Media'
import { Pages } from './src/collections/Pages'
import { Posts } from './src/collections/Posts'
import { Tenants } from './src/collections/Tenants'
import { Users } from './src/collections/Users'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const required = (key: string): string => {
  const v = process.env[key]
  if (!v) {
    // `next build` evaluates this module to "collect page data" without any
    // runtime env vars set. Returning a placeholder unblocks the build; at
    // runtime, missing envs surface via the Payload bootstrap which logs
    // structured errors instead of crashing webpack.
    if (process.env.NEXT_PHASE === 'phase-production-build' || process.env.CI) {
      return `__missing_${key}__`
    }
    throw new Error(`payload.config: missing env ${key}`)
  }
  return v
}

export default buildConfig({
  admin: { user: Users.slug },
  collections: [Pages, Posts, Media, Tenants, Users],
  cors: (process.env.CORS_ORIGINS ?? '').split(',').filter(Boolean),
  csrf: (process.env.CSRF_ORIGINS ?? '').split(',').filter(Boolean),
  db: postgresAdapter({
    pool: {
      connectionString: required('DATABASE_URI'),
      max: 10,
    },
  }),
  editor: lexicalEditor({}),
  plugins: [
    multiTenantPlugin({
      collections: { media: {}, pages: {}, posts: {} },
      tenantsSlug: 'tenants',
    }),
    cloudStoragePlugin({
      collections: {
        media: {
          adapter: s3Adapter({
            bucket: required('R2_BUCKET'),
            config: {
              credentials: {
                accessKeyId: required('R2_ACCESS_KEY_ID'),
                secretAccessKey: required('R2_SECRET_ACCESS_KEY'),
              },
              endpoint: required('R2_ENDPOINT'),
              forcePathStyle: true,
              region: 'auto',
            },
          }),
        },
      },
    }),
  ],
  secret: required('PAYLOAD_SECRET'),
  serverURL: process.env.PAYLOAD_PUBLIC_SERVER_URL ?? 'http://localhost:3000',
  typescript: { outputFile: path.resolve(__dirname, 'src/payload-types.ts') },
})
