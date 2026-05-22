# AGENTS.md — apps/marketing

This is the public marketing site. Rules an agent must follow:

1. **Astro components by default.** `.astro` files. Add a React island only when a real interactive widget needs it; pay the React payload cost only there.
2. **No client-side JS without a reason.** If a page is static, ship zero JS.
3. **All forms go through `@pkg/forms`.** No raw `useForm` in this app.
4. **All tracking calls go through `@pkg/tracking`.** It enforces consent.
5. **All analytics events must declare their consent category** in the call site.
6. **No third-party scripts above the fold.** No GTM, no Segment, no Hotjar.
7. **Performance budget is enforced in CI.** Don't paper over a regression with a "AGENT-TODO".
8. **Tests are co-located** under `src/__tests__/`.
9. **CMS content** comes via the Astro Content Layer + `@pkg/cms-client`. Don't fetch CMS in components.

Reading list before editing:
- `docs/specs/frontend/framework-choices.md`
- `docs/specs/frontend/marketing-and-landing-pages.md`
- `docs/specs/frontend/cloudflare-deployment.md`
