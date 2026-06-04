# ADR-0010: Eliminating Next.js from this template

- **Status:** Accepted
- **Date:** 2026-05-22
- **Deciders:** @shaiknoorullah

## Context

Next.js is the dominant React framework in 2026. It is mature, well-maintained, MIT-licensed, and broadly understood. The default reaction to "we need a React frontend" is "use Next.js".

This ADR exists to make the _opposite_ default explicit for this template: **Next.js is not in the toolbox.** It can be added by a downstream consumer if they have a specific need, but the template ships without it.

This is a contentious decision and the rest of this ADR makes the case (both sides) carefully.

## The case for Next.js (the side we don't pick — heard fairly)

1. **Mass adoption.** Largest React-framework community. Easiest hiring story. Most tutorial coverage.
2. **React Server Components.** Next is the canonical RSC runtime. New RSC features tend to land here first.
3. **App Router + Server Actions** are productive when you're all-in on Vercel's runtime model.
4. **Image / font optimization** built in. Negligible config.
5. **Ecosystem.** Most of the React community's "blueprints" assume Next.js.
6. **One framework covers many surfaces.** Marketing pages, dashboards, docs (via Nextra) — all in Next.

## The case against Next.js (the side we pick)

### 1. Gravitational pull toward Vercel

The framework code is MIT, but Next.js's strongest features are pull-the-rope-toward-Vercel:

- **ISR** is first-class on Vercel; on Cloudflare it requires the OpenNext adapter, which is functional but lags upstream and ships its own caveats. <https://opennext.js.org/cloudflare>
- **Image Optimization** defaults to Vercel's image CDN; alternate setups (Cloudflare Images, Imgix) are configurable but not the path of least resistance.
- **Edge Runtime / Middleware** is _not_ the same as Workers' V8 isolate; the runtime semantics differ subtly enough that OpenNext patches around them. We pay debugging cost when a feature works on Vercel but not CF.
- **Vercel Analytics, Speed Insights, Cron** — Vercel-proprietary. Replacing them on Cloudflare means assembling Cloudflare Web Analytics + Workers Cron Triggers + custom Speed Insights collection.
- **Server Actions** + the error boundary + revalidation story lean on Vercel's infra assumptions.

None of these are blockers. They are friction. Friction compounds.

### 2. Resource cost — relevant to our operator constraint

The operator's stated optimization is "save on resources". Next.js's Node runtime carries a non-trivial floor — even for a static marketing page, the per-request overhead is higher than Astro's static output. Lighthouse Performance scores on a vanilla Next site routinely sit 10–15 points below a vanilla Astro site doing the same job.

For a marketing site that won't ever need SSR per request, paying for a Node runtime is wasted budget.

### 3. We don't need a single framework that "does everything"

Our matrix uses Astro (content), Expo (app + mobile), Hono (edge endpoints), and TanStack Start (reserved fallback). Each tool owns its surface and ships nothing it doesn't need.

Next.js's strength — "covers many surfaces" — is also its weakness in our case: it brings a Node runtime, a React tree, and Vercel-shaped opinions to a marketing page that should be static HTML + a 5 KB island.

### 4. Cross-platform code sharing

We share code with React Native via Expo + react-native-web. Next.js does not help here — it is web-only. Any code we write in Next.js does not reduce the mobile build.

### 5. License is fine; gravity is the issue

Next.js MIT license is permissive. The gravity comes from convention and developer-time investment in Vercel-shaped patterns. Once a team commits to Next.js, the "use Vercel" decision is easier than the "use Cloudflare" decision _every single time_. We avoid the gravity by not starting on Next.

### 6. RSC feature velocity gap will close

This is the strongest "yes Next" point. RSC is genuinely interesting and Next leads. TanStack Start is implementing RSC support (<https://tanstack.com/start/latest/docs/framework/react/server-functions>). The gap closes over the template's lifetime.

## Decision

**Next.js is not part of this template's default toolbox.**

If a consumer of this template has a hard requirement for Next.js (RSC features not yet in TanStack Start, an existing team that lives in Next, a Vercel-bound deployment plan), they may add it as `apps/<name>` per their needs. The template does not ship it preconfigured and does not endorse adding it without a written rationale.

## Consequences

### Positive

- Lower resource footprint across marketing + docs surfaces.
- No Vercel gravity. Cloudflare is the unambiguous deploy target.
- Smaller cognitive surface — engineers learn Astro + Expo + Hono, not Astro + Expo + Hono + Next.
- No OpenNext adapter dependency for CF deploys.

### Negative

- We forgo Next's developer-mindshare advantage. Engineers with only Next experience need an onboarding moment for Astro and Expo. Mitigated by the framework-choices spec.
- RSC feature velocity. We accept that the latest RSC ergonomics land in Next first and reach TanStack Start later.
- Hiring story: "we don't use Next" raises eyebrows in some interview pools. Documented stance.

### Neutral / Follow-up

- If a future surface genuinely demands Next.js, we revisit with a follow-up ADR. The bar is not low: "we prefer Next" is not enough; "we need [specific RSC feature] and no other framework has it" is.
- If TanStack Start RSC support reaches parity, this ADR's "fallback for heavy-interaction surfaces" becomes more comfortable.

## Alternatives considered

- **Keep Next.js as an option but recommend Astro.** Rejected — having Next as an "option" is what generates the gravity. Removing the option removes the gravity.
- **Use Next.js everywhere.** Rejected — operator constraints (C3, C6, C7) explicitly oppose.
- **Switch to a Next.js + Nextra docs stack.** Rejected — Astro + Starlight is lighter and avoids Next entirely.

## References

- [Next.js docs](https://nextjs.org/docs)
- [OpenNext for Cloudflare](https://opennext.js.org/cloudflare)
- [Vercel platform features](https://vercel.com/products)
- [TanStack Start](https://tanstack.com/start/)
- `docs/specs/frontend/framework-choices.md`
- Research: `~/work/.handoffs/cluster-cpu-overcommit/2026-05-22/research-frontend-stack.md` §3.4
