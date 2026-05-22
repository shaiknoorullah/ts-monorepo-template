// packages/seo/src/og.ts
//
// OpenGraph helpers — two surfaces:
//
//   1. `buildOpenGraph(input)` — pure tag map, edge-safe, used by every app
//      to populate `<meta property="og:..." />` head tags.
//   2. `generateOgImage(props)` — renders a 1200x630 PNG via satori + resvg
//      (WASM). Returns a Web `Response` so it slots straight into Cloudflare
//      Workers / Vercel Edge / Astro endpoints.
//
// The image renderer is intentionally dependency-injected: satori and
// @resvg/resvg-wasm are dynamically imported so apps that only need the
// tag-builder don't pay the WASM cost.

export interface OpenGraphInput {
  title: string
  description: string
  url: string
  image?: string
  type?: 'website' | 'article' | 'product'
  siteName?: string
}

export function buildOpenGraph(input: OpenGraphInput): Record<string, string> {
  const tags: Record<string, string> = {
    'og:title': input.title,
    'og:description': input.description,
    'og:url': input.url,
    'og:type': input.type ?? 'website',
  }
  if (input.image) tags['og:image'] = input.image
  if (input.siteName) tags['og:site_name'] = input.siteName
  return tags
}

/* --------------------------- image generator --------------------------- */

export interface OgImageProps {
  title: string
  subtitle?: string
  theme?: 'light' | 'dark'
  logoUrl?: string
  /** CSS gradient applied as the background. Default depends on theme. */
  gradient?: string
  /** Width, default 1200. */
  width?: number
  /** Height, default 630. */
  height?: number
  /**
   * Font data for satori. Supply at least one Inter weight.
   * Edge-safe: pass `ArrayBuffer` loaded from a binding or fetched once.
   */
  fonts?: Array<{
    name: string
    data: ArrayBuffer | Uint8Array
    weight?: 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900
    style?: 'normal' | 'italic'
  }>
}

const PRESETS = {
  light: {
    bg: 'linear-gradient(135deg, #ffffff 0%, #f6f8fa 100%)',
    fg: '#0d1117',
    accent: '#1f6feb',
    muted: '#57606a',
  },
  dark: {
    bg: 'linear-gradient(135deg, #0d1117 0%, #161b22 100%)',
    fg: '#c9d1d9',
    accent: '#58a6ff',
    muted: '#8b949e',
  },
} as const

/**
 * Build the satori VDOM. Extracted so tests can snapshot it without loading
 * the actual satori / resvg WASM (which is megabytes).
 */
export function buildOgImageVDOM(props: OgImageProps): unknown {
  const theme = PRESETS[props.theme ?? 'dark']
  const width = props.width ?? 1200
  const height = props.height ?? 630

  return {
    type: 'div',
    props: {
      style: {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        width,
        height,
        padding: 64,
        background: props.gradient ?? theme.bg,
        fontFamily: 'Inter, sans-serif',
        color: theme.fg,
      },
      children: [
        // Top row: logo
        props.logoUrl
          ? {
              type: 'div',
              props: {
                style: { display: 'flex', alignItems: 'center', height: 64 },
                children: [
                  {
                    type: 'img',
                    props: { src: props.logoUrl, width: 64, height: 64 },
                  },
                ],
              },
            }
          : { type: 'div', props: { style: { height: 64 } } },
        // Main: title + subtitle
        {
          type: 'div',
          props: {
            style: { display: 'flex', flexDirection: 'column', gap: 24 },
            children: [
              {
                type: 'div',
                props: {
                  style: {
                    fontSize: 72,
                    fontWeight: 700,
                    lineHeight: 1.1,
                    letterSpacing: '-0.02em',
                  },
                  children: props.title,
                },
              },
              props.subtitle
                ? {
                    type: 'div',
                    props: {
                      style: { fontSize: 32, color: theme.muted, lineHeight: 1.4 },
                      children: props.subtitle,
                    },
                  }
                : null,
            ].filter(Boolean),
          },
        },
        // Footer accent bar
        {
          type: 'div',
          props: {
            style: { display: 'flex', height: 8, background: theme.accent, borderRadius: 4 },
          },
        },
      ],
    },
  }
}

/**
 * Render `OgImageProps` to a PNG `Response`. Returns 1200x630 by default.
 *
 * Throws if neither `props.fonts` nor a `__OG_FONT__` global is supplied.
 * Designed for Cloudflare Workers / edge runtimes — uses `@resvg/resvg-wasm`
 * which works on V8 isolates.
 */
export async function generateOgImage(props: OgImageProps): Promise<Response> {
  const { default: satori } = await import('satori')
  const resvgMod = await import('@resvg/resvg-wasm')
  const Resvg = (resvgMod as { Resvg: new (svg: string) => { render: () => { asPng: () => Uint8Array } } })
    .Resvg

  const fonts = props.fonts ?? []
  if (!fonts.length) {
    throw new Error(
      'generateOgImage: at least one font must be provided in `props.fonts`. ' +
        'Load Inter from /assets at boot and pass it in.',
    )
  }

  const width = props.width ?? 1200
  const height = props.height ?? 630
  const vdom = buildOgImageVDOM(props)

  const svg = await satori(vdom as never, {
    width,
    height,
    fonts: fonts.map((f) => ({
      name: f.name,
      data: f.data,
      weight: f.weight ?? 700,
      style: f.style ?? 'normal',
    })),
  })

  const png = new Resvg(svg).render().asPng()
  return new Response(png, {
    status: 200,
    headers: {
      'content-type': 'image/png',
      'cache-control': 'public, max-age=31536000, immutable',
    },
  })
}

/**
 * Render the satori VDOM directly to SVG (no PNG step). Cheaper and used by
 * tests; consumers can keep the SVG and let the browser rasterise.
 */
export async function generateOgImageSvg(
  props: OgImageProps & { fonts: NonNullable<OgImageProps['fonts']> },
): Promise<string> {
  const { default: satori } = await import('satori')
  const width = props.width ?? 1200
  const height = props.height ?? 630
  return satori(buildOgImageVDOM(props) as never, {
    width,
    height,
    fonts: props.fonts.map((f) => ({
      name: f.name,
      data: f.data,
      weight: f.weight ?? 700,
      style: f.style ?? 'normal',
    })),
  })
}
