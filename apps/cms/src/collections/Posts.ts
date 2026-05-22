// apps/cms/src/collections/Posts.ts

import type { CollectionConfig } from 'payload'

import { isAdmin, isPublishedOrAdmin } from '../access'

export const Posts: CollectionConfig = {
  access: {
    create: isAdmin,
    delete: isAdmin,
    read: isPublishedOrAdmin,
    update: isAdmin,
  },
  admin: {
    defaultColumns: ['title', 'slug', '_status', 'publishedAt'],
    useAsTitle: 'title',
  },
  fields: [
    { name: 'title', required: true, type: 'text' },
    { index: true, name: 'slug', required: true, type: 'text', unique: true },
    { name: 'excerpt', type: 'textarea' },
    { name: 'body', type: 'richText' },
    { name: 'publishedAt', type: 'date' },
    {
      fields: [{ name: 'value', type: 'text' }],
      name: 'tags',
      type: 'array',
    },
    {
      name: 'coverImage',
      relationTo: 'media',
      type: 'upload',
    },
  ],
  slug: 'posts',
  versions: { drafts: true },
}
