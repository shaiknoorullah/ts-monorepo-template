// apps/cms/src/app/(payload)/admin/[[...segments]]/page.tsx
//
// Catch-all that hands every /admin/* request to Payload's bundled UI.

/* eslint-disable @typescript-eslint/no-explicit-any */
import { generatePageMetadata, RootPage } from '@payloadcms/next/views'

import config from '../../../../../payload.config'

interface Args {
  params: Promise<{ segments?: string[] }>
  searchParams: Promise<Record<string, string | string[]>>
}

export const generateMetadata = ({ params, searchParams }: Args) =>
  generatePageMetadata({ config: config, params, searchParams })

const Page = ({ params, searchParams }: Args) =>
  RootPage({
    config: config,
    importMap: {},
    params: params as any,
    searchParams,
  })

export default Page
