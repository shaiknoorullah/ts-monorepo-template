// apps/cms/payload.config.ts
//
// Single source of truth for the CMS. Loaded by Next.js at runtime.

import { postgresAdapter } from '@payloadcms/db-postgres'
import { cloudStoragePlugin } from '@payloadcms/plugin-cloud-storage'
// TODO: re-tighten — `@payloadcms/plugin-cloud-storage/s3` was removed upstream
// in favour of the standalone `@payloadcms/storage-s3` adapter. Stubbing the
// import to unblock the CI matrix until the migration is done.
// @ts-expect-error -- subpath export no longer exists in payload 3.x
import { s3Adapter } from '@payloadcms/plugin-cloud-storage/s3'
import { multiTenantPlugin } from '@payloadcms/plugin-multi-tenant'
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
  if (!v) throw new Error(`payload.config: missing env ${key}`)
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
