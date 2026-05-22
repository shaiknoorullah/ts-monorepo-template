# AGENTS.md — apps/web-app

1. **No `Platform.OS` checks.** Lift platform divergence into `packages/*` with `.web.ts` / `.native.ts` variants.
2. **No direct fetch.** Use `@pkg/api-client`. Auth + tenancy headers flow automatically.
3. **Forms use `@pkg/forms`.** No raw RHF.
4. **Tenancy is resolved at boot** via `@pkg/tenancy-client`. Don't re-implement.
5. **All exported components have explicit types.** No `function X()` without a return type.
