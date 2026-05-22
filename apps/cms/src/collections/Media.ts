// apps/cms/src/collections/Media.ts

import type { CollectionConfig } from 'payload'

import { isAdmin } from '../access'

export const Media: CollectionConfig = {
  access: {
    create: isAdmin,
    delete: isAdmin,
    read: () => true, // public bucket
    update: isAdmin,
  },
  admin: { useAsTitle: 'filename' },
  fields: [
    { name: 'alt', required: true, type: 'text' },
    { name: 'caption', type: 'text' },
  ],
  slug: 'media',
  upload: {
    imageSizes: [
      { name: 'thumbnail', width: 320 },
      { name: 'card', width: 768 },
      { name: 'hero', width: 1600 },
    ],
    mimeTypes: ['image/*', 'application/pdf', 'video/mp4'],
    staticDir: 'media',
  },
}
