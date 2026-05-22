// apps/cms/src/collections/Users.ts
//
// Argon2id-backed auth. Payload's built-in auth uses bcrypt; we wrap it
// with a `beforeChange` hook that re-hashes the password with argon2id
// using `argon2` (libsodium-style params). When we migrate to Ory Kratos
// the `migrationStatus` field will track per-user cutover.

import type { CollectionConfig } from 'payload'
import argon2 from 'argon2'
import { isAdmin, isAdminOrSelf } from '../access'

export const Users: CollectionConfig = {
  slug: 'users',
  auth: {
    useAPIKey: true,
    tokenExpiration: 60 * 60 * 8, // 8h
    maxLoginAttempts: 5,
    lockTime: 5 * 60 * 1000,
  },
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'role', 'tenant'],
  },
  access: {
    create: isAdmin,
    read: isAdminOrSelf,
    update: isAdminOrSelf,
    delete: isAdmin,
    admin: ({ req: { user } }) =>
      user?.collection === 'users' &&
      ((user as { role?: string }).role === 'admin' ||
        (user as { role?: string }).role === 'editor'),
  },
  fields: [
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'editor',
      options: [
        { label: 'Admin', value: 'admin' },
        { label: 'Editor', value: 'editor' },
        { label: 'Viewer', value: 'viewer' },
      ],
    },
    {
      name: 'tenant',
      type: 'relationship',
      relationTo: 'tenants',
      required: false,
    },
    {
      name: 'passwordHashArgon',
      type: 'text',
      admin: { hidden: true, readOnly: true },
    },
    {
      name: 'migrationStatus',
      type: 'select',
      defaultValue: 'payload',
      admin: { description: 'Auth migration tracker — Ory Kratos cutover.' },
      options: [
        { label: 'Payload (bcrypt+argon2id)', value: 'payload' },
        { label: 'Migrating', value: 'migrating' },
        { label: 'Kratos', value: 'kratos' },
      ],
    },
  ],
  hooks: {
    beforeChange: [
      async ({ data, operation }) => {
        if (operation === 'create' && typeof data.password === 'string') {
          data.passwordHashArgon = await argon2.hash(data.password, {
            type: argon2.argon2id,
            memoryCost: 19_456, // 19 MiB — OWASP 2024 recommendation
            timeCost: 2,
            parallelism: 1,
          })
        }
        return data
      },
    ],
  },
}
