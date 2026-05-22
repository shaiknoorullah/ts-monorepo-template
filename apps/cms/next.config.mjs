// apps/cms/next.config.mjs
//
// Payload 3 mandates its bundled Next.js — see ADR 0013. This is the
// ONE place Next.js is in scope in this monorepo.

import { withPayload } from '@payloadcms/next/withPayload'

/** @type {import('next').NextConfig} */
const config = {
  experimental: {
    serverActions: { bodySizeLimit: '50mb' },
  },
  reactStrictMode: true,
}

export default withPayload(config)
