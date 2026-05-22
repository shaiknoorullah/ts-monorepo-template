// apps/cms/src/collections/Tenants.ts

import type { CollectionConfig } from 'payload'

import { isAdmin } from '../access'

export const Tenants: CollectionConfig = {
  access: { create: isAdmin, delete: isAdmin },
  admin: { defaultColumns: ['name', 'slug', 'plan'], useAsTitle: 'name' },
  fields: [
    { name: 'name', required: true, type: 'text' },
    { index: true, name: 'slug', required: true, type: 'text', unique: true },
    {
      defaultValue: 'starter',
      name: 'plan',
      options: [
        { label: 'Starter', value: 'starter' },
        { label: 'Growth', value: 'growth' },
        { label: 'Enterprise', value: 'enterprise' },
      ],
      required: true,
      type: 'select',
    },
    {
      fields: [
        { name: 'brand', type: 'text' },
        { name: 'surface', type: 'text' },
        { name: 'surfaceMuted', type: 'text' },
        { name: 'border', type: 'text' },
        { name: 'text', type: 'text' },
        { name: 'textMuted', type: 'text' },
        { name: 'logoUrl', type: 'text' },
      ],
      name: 'theme',
      type: 'group',
    },
  ],
  slug: 'tenants',
}
