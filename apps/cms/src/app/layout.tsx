// apps/cms/src/app/layout.tsx

import type { ReactNode } from 'react'

export const metadata = {
  title: 'CMS',
  description: 'Payload-powered content management.',
}

export default function RootLayout({ children }: { children: ReactNode }): JSX.Element {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
