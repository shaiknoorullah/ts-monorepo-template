// apps/cms/src/collections/Posts.ts

import type { CollectionConfig } from 'payload'
import { isAdmin, isPublishedOrAdmin } from '../access'

export const Posts: CollectionConfig = {
  slug: 'posts',
  versions: { drafts: true },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', '_status', 'publishedAt'],
  },
  access: {
    read: isPublishedOrAdmin,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'slug', type: 'text', required: true, unique: true, index: true },
    { name: 'excerpt', type: 'textarea' },
    { name: 'body', type: 'richText' },
    { name: 'publishedAt', type: 'date' },
    {
      name: 'tags',
      type: 'array',
      fields: [{ name: 'value', type: 'text' }],
    },
    {
      name: 'coverImage',
      type: 'upload',
      relationTo: 'media',
    },
  ],
}
