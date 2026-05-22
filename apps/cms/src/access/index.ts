// apps/cms/src/access/index.ts
//
// Helpers for Payload `access` callbacks.

import type { Access } from 'payload'

export const isAdmin: Access = ({ req: { user } }) =>
  user?.collection === 'users' && (user as { role?: string }).role === 'admin'

export const isAdminOrSelf: Access = ({ req: { user }, id }) => {
  if (!user) return false
  if ((user as { role?: string }).role === 'admin') return true
  return user.id === id
}

export const isPublishedOrAdmin: Access = ({ req: { user } }) => {
  if ((user as { role?: string } | null)?.role === 'admin') return true
  return { _status: { equals: 'published' } }
}
