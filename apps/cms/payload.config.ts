// apps/cms/payload.config.ts
//
// Single source of truth for the CMS. Loaded by Next.js at runtime.

import { buildConfig } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { cloudStoragePlugin } from '@payloadcms/plugin-cloud-storage'
import { s3Adapter } from '@payloadcms/plugin-cloud-storage/s3'
import { multiTenantPlugin } from '@payloadcms/plugin-multi-tenant'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { Users } from './src/collections/Users'
import { Tenants } from './src/collections/Tenants'
import { Pages } from './src/collections/Pages'
import { Posts } from './src/collections/Posts'
import { Media } from './src/collections/Media'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const required = (key: string): string => {
  const v = process.env[key]
  if (!v) throw new Error(`payload.config: missing env ${key}`)
  return v
}

export default buildConfig({
  serverURL: process.env.PAYLOAD_PUBLIC_SERVER_URL ?? 'http://localhost:3000',
  admin: { user: Users.slug },
  collections: [Pages, Posts, Media, Tenants, Users],
  editor: lexicalEditor({}),
  secret: required('PAYLOAD_SECRET'),
  typescript: { outputFile: path.resolve(__dirname, 'src/payload-types.ts') },
  db: postgresAdapter({
    pool: {
      connectionString: required('DATABASE_URI'),
      max: 10,
    },
  }),
  plugins: [
    multiTenantPlugin({
      collections: { pages: {}, posts: {}, media: {} },
      tenantsSlug: 'tenants',
    }),
    cloudStoragePlugin({
      collections: {
        media: {
          adapter: s3Adapter({
            bucket: required('R2_BUCKET'),
            config: {
              endpoint: required('R2_ENDPOINT'),
              region: 'auto',
              credentials: {
                accessKeyId: required('R2_ACCESS_KEY_ID'),
                secretAccessKey: required('R2_SECRET_ACCESS_KEY'),
              },
              forcePathStyle: true,
            },
          }),
        },
      },
    }),
  ],
  cors: (process.env.CORS_ORIGINS ?? '').split(',').filter(Boolean),
  csrf: (process.env.CSRF_ORIGINS ?? '').split(',').filter(Boolean),
})
