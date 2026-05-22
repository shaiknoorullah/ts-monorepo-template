# AGENTS.md — apps/docs-public

Customer-facing docs. Rules:

1. **Frontmatter must include `title` + `description`.** SEO depends on it.
2. **Code blocks must declare language.** ` ```ts `, ` ```bash `, etc.
3. **Don't link to internal staff docs.** Internal docs live at `docs/` (VitePress).
4. **Don't embed third-party trackers.** Analytics is enabled via Cloudflare Web Analytics at the Pages-project level.
5. **Version numbers should be variables**, not hard-coded. Use Starlight's `<Aside>` to flag version-specific content.
6. **Images go in `src/assets/`**, optimized via Astro's `<Image />`.

Reading list:
- `docs/specs/frontend/documentation-sites.md`
- `docs/specs/frontend/cloudflare-deployment.md`
