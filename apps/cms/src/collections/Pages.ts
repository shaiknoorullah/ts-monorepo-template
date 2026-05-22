// apps/cms/src/collections/Pages.ts

import type { CollectionConfig } from 'payload'

import { isAdmin, isPublishedOrAdmin } from '../access'

export const Pages: CollectionConfig = {
  access: {
    create: isAdmin,
    delete: isAdmin,
    read: isPublishedOrAdmin,
    update: isAdmin,
  },
  admin: { defaultColumns: ['title', 'slug', '_status'], useAsTitle: 'title' },
  fields: [
    { name: 'title', required: true, type: 'text' },
    { index: true, name: 'slug', required: true, type: 'text', unique: true },
    { name: 'excerpt', type: 'textarea' },
    { name: 'body', type: 'richText' },
    {
      fields: [
        { name: 'metaTitle', type: 'text' },
        { name: 'metaDescription', type: 'textarea' },
        { name: 'ogImage', relationTo: 'media', type: 'upload' },
      ],
      name: 'seo',
      type: 'group',
    },
  ],
  slug: 'pages',
  versions: { drafts: true },
}
