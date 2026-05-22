// apps/cms/src/app/layout.tsx

import type { ReactNode } from 'react'

export const metadata = {
  description: 'Payload-powered content management.',
  title: 'CMS',
}

export default function RootLayout({ children }: { children: ReactNode }): JSX.Element {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
