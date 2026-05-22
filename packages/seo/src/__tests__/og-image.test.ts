// packages/seo/src/__tests__/og-image.test.ts

import { describe, expect, it } from 'vitest'
import { buildOgImageVDOM } from '../og'

describe('buildOgImageVDOM', () => {
  it('produces a 1200x630 root by default', () => {
    const vdom = buildOgImageVDOM({ title: 'Hello' }) as {
      props: { style: { width: number; height: number; padding: number } }
    }
    expect(vdom.props.style.width).toBe(1200)
    expect(vdom.props.style.height).toBe(630)
    expect(vdom.props.style.padding).toBe(64)
  })

  it('matches the dark-theme snapshot', () => {
    const vdom = buildOgImageVDOM({
      title: 'Snapshot Title',
      subtitle: 'A subtitle',
      theme: 'dark',
    })
    expect(vdom).toMatchSnapshot()
  })

  it('matches the light-theme snapshot with logo', () => {
    const vdom = buildOgImageVDOM({
      title: 'Light',
      subtitle: 'with logo',
      theme: 'light',
      logoUrl: 'https://example.com/logo.png',
    })
    expect(vdom).toMatchSnapshot()
  })
})
