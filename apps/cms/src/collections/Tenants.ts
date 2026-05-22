// apps/cms/src/collections/Tenants.ts

import type { CollectionConfig } from 'payload'
import { isAdmin } from '../access'

export const Tenants: CollectionConfig = {
  slug: 'tenants',
  admin: { useAsTitle: 'name', defaultColumns: ['name', 'slug', 'plan'] },
  access: { create: isAdmin, delete: isAdmin },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'slug', type: 'text', required: true, unique: true, index: true },
    {
      name: 'plan',
      type: 'select',
      required: true,
      defaultValue: 'starter',
      options: [
        { label: 'Starter', value: 'starter' },
        { label: 'Growth', value: 'growth' },
        { label: 'Enterprise', value: 'enterprise' },
      ],
    },
    {
      name: 'theme',
      type: 'group',
      fields: [
        { name: 'brand', type: 'text' },
        { name: 'surface', type: 'text' },
        { name: 'surfaceMuted', type: 'text' },
        { name: 'border', type: 'text' },
        { name: 'text', type: 'text' },
        { name: 'textMuted', type: 'text' },
        { name: 'logoUrl', type: 'text' },
      ],
    },
  ],
}
