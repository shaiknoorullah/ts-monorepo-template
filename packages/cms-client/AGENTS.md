# AGENTS.md — packages/cms-client

1. **All CMS responses are Zod-validated** at the package boundary. Never trust untyped CMS responses in app code.
2. **No mutation helpers.** This package reads. Authoring happens in the CMS admin UI.
3. **Astro Content Layer loader** lives in `src/astro-loader.ts` (TODO — scaffold pending).
