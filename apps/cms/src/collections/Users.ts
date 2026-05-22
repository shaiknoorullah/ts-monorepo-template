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
  access: {
    admin: ({ req: { user } }) =>
      user?.collection === 'users' &&
      ((user as { role?: string }).role === 'admin' ||
        (user as { role?: string }).role === 'editor'),
    create: isAdmin,
    delete: isAdmin,
    read: isAdminOrSelf,
    update: isAdminOrSelf,
  },
  admin: {
    defaultColumns: ['email', 'role', 'tenant'],
    useAsTitle: 'email',
  },
  auth: {
    lockTime: 5 * 60 * 1000,
    maxLoginAttempts: 5,
    tokenExpiration: 60 * 60 * 8, // 8h
    useAPIKey: true,
  },
  fields: [
    {
      defaultValue: 'editor',
      name: 'role',
      options: [
        { label: 'Admin', value: 'admin' },
        { label: 'Editor', value: 'editor' },
        { label: 'Viewer', value: 'viewer' },
      ],
      required: true,
      type: 'select',
    },
    {
      name: 'tenant',
      relationTo: 'tenants',
      required: false,
      type: 'relationship',
    },
    {
      admin: { hidden: true, readOnly: true },
      name: 'passwordHashArgon',
      type: 'text',
    },
    {
      admin: { description: 'Auth migration tracker — Ory Kratos cutover.' },
      defaultValue: 'payload',
      name: 'migrationStatus',
      options: [
        { label: 'Payload (bcrypt+argon2id)', value: 'payload' },
        { label: 'Migrating', value: 'migrating' },
        { label: 'Kratos', value: 'kratos' },
      ],
      type: 'select',
    },
  ],
  hooks: {
    beforeChange: [
      async ({ data, operation }) => {
        if (operation === 'create' && typeof data.password === 'string') {
          data.passwordHashArgon = await argon2.hash(data.password, {
            memoryCost: 19_456, // 19 MiB — OWASP 2024 recommendation
            parallelism: 1,
            timeCost: 2,
            type: argon2.argon2id,
          })
        }
        return data
      },
    ],
  },
  slug: 'users',
}
