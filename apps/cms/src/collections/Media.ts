// apps/cms/src/collections/Media.ts

import type { CollectionConfig } from 'payload'
import { isAdmin } from '../access'

export const Media: CollectionConfig = {
  slug: 'media',
  upload: {
    staticDir: 'media',
    mimeTypes: ['image/*', 'application/pdf', 'video/mp4'],
    imageSizes: [
      { name: 'thumbnail', width: 320 },
      { name: 'card', width: 768 },
      { name: 'hero', width: 1600 },
    ],
  },
  admin: { useAsTitle: 'filename' },
  access: {
    read: () => true, // public bucket
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  fields: [
    { name: 'alt', type: 'text', required: true },
    { name: 'caption', type: 'text' },
  ],
}
