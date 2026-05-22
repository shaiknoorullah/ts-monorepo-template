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

export interface OgImageProps {
  /**
   * Font data for satori. Supply at least one Inter weight.
   * Edge-safe: pass `ArrayBuffer` loaded from a binding or fetched once.
   */
  fonts?: {
    data: ArrayBuffer | Uint8Array
    name: string
    style?: 'italic' | 'normal'
    weight?: 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900
  }[]
  /** CSS gradient applied as the background. Default depends on theme. */
  gradient?: string
  /** Height, default 630. */
  height?: number
  logoUrl?: string
  subtitle?: string
  theme?: 'dark' | 'light'
  title: string
  /** Width, default 1200. */
  width?: number
}

export interface OpenGraphInput {
  description: string
  image?: string
  siteName?: string
  title: string
  type?: 'article' | 'product' | 'website'
  url: string
}

/* --------------------------- image generator --------------------------- */

export function buildOpenGraph(input: OpenGraphInput): Record<string, string> {
  const tags: Record<string, string> = {
    'og:description': input.description,
    'og:title': input.title,
    'og:type': input.type ?? 'website',
    'og:url': input.url,
  }
  if (input.image) tags['og:image'] = input.image
  if (input.siteName) tags['og:site_name'] = input.siteName
  return tags
}

const PRESETS = {
  dark: {
    accent: '#58a6ff',
    bg: 'linear-gradient(135deg, #0d1117 0%, #161b22 100%)',
    fg: '#c9d1d9',
    muted: '#8b949e',
  },
  light: {
    accent: '#1f6feb',
    bg: 'linear-gradient(135deg, #ffffff 0%, #f6f8fa 100%)',
    fg: '#0d1117',
    muted: '#57606a',
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
    props: {
      children: [
        // Top row: logo
        props.logoUrl
          ? {
              props: {
                children: [
                  {
                    props: { height: 64, src: props.logoUrl, width: 64 },
                    type: 'img',
                  },
                ],
                style: { alignItems: 'center', display: 'flex', height: 64 },
              },
              type: 'div',
            }
          : { props: { style: { height: 64 } }, type: 'div' },
        // Main: title + subtitle
        {
          props: {
            children: [
              {
                props: {
                  children: props.title,
                  style: {
                    fontSize: 72,
                    fontWeight: 700,
                    letterSpacing: '-0.02em',
                    lineHeight: 1.1,
                  },
                },
                type: 'div',
              },
              props.subtitle
                ? {
                    props: {
                      children: props.subtitle,
                      style: { color: theme.muted, fontSize: 32, lineHeight: 1.4 },
                    },
                    type: 'div',
                  }
                : null,
            ].filter(Boolean),
            style: { display: 'flex', flexDirection: 'column', gap: 24 },
          },
          type: 'div',
        },
        // Footer accent bar
        {
          props: {
            style: { background: theme.accent, borderRadius: 4, display: 'flex', height: 8 },
          },
          type: 'div',
        },
      ],
      style: {
        background: props.gradient ?? theme.bg,
        color: theme.fg,
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'Inter, sans-serif',
        height,
        justifyContent: 'space-between',
        padding: 64,
        width,
      },
    },
    type: 'div',
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
  const Resvg = (
    resvgMod as { Resvg: new (svg: string) => { render: () => { asPng: () => Uint8Array } } }
  ).Resvg

  const fonts = props.fonts ?? []
  if (fonts.length === 0) {
    throw new Error(
      'generateOgImage: at least one font must be provided in `props.fonts`. ' +
        'Load Inter from /assets at boot and pass it in.',
    )
  }

  const width = props.width ?? 1200
  const height = props.height ?? 630
  const vdom = buildOgImageVDOM(props)

  const svg = await satori(vdom as never, {
    fonts: fonts.map((f) => ({
      data: f.data,
      name: f.name,
      style: f.style ?? 'normal',
      weight: f.weight ?? 700,
    })) as never,
    height,
    width,
  })

  const png = new Resvg(svg).render().asPng()
  return new Response(png, {
    headers: {
      'cache-control': 'public, max-age=31536000, immutable',
      'content-type': 'image/png',
    },
    status: 200,
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
    fonts: props.fonts.map((f) => ({
      data: f.data,
      name: f.name,
      style: f.style ?? 'normal',
      weight: f.weight ?? 700,
    })) as never,
    height,
    width,
  })
}
