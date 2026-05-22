# Contributing

Thanks for considering a contribution. This document explains the workflow.

## Code of Conduct

This project follows the [Contributor Covenant 2.1](CODE_OF_CONDUCT.md). By participating, you agree to abide by it.

## Development setup

```bash
corepack enable
corepack use pnpm@10.15.0
pnpm install
pnpm prepare
pnpm doctor
```

Node ≥ 22 (the `.nvmrc` file is authoritative). pnpm ≥ 10.15 (corepack pins it).

## Workflow

1. **Branch** from `main`: `git checkout -b feat/<scope>-<short-description>`.
2. **Code**. Follow the conventions in [AGENTS.md](AGENTS.md).
3. **Test**: `pnpm test:affected`. Add tests for new behavior; aim for ≥ 80% coverage.
4. **Doctor**: `pnpm doctor` — must pass.
5. **Changeset**: `pnpm changeset` if your change affects a published package. Otherwise label the PR `no-changeset`.
6. **Commit** using Conventional Commits — `feat(scope): Sentence-case subject`.
7. **Push** and open a PR. Fill out the template.
8. **Address review**. Squash isn't required; we prefer atomic commits.

## Coding standards

See [AGENTS.md § 4](AGENTS.md#4-coding-conventions) for the full list. Highlights:

- `strict: true` + `noUncheckedIndexedAccess` + `exactOptionalPropertyTypes`.
- Explicit return types on exports.
- `import type { ... }` for type-only imports.
- No `any`. No `// @ts-ignore` (use `@ts-expect-error <reason>`).
- Sort imports via perfectionist (auto-fix on save).

## Tests

- Vitest only — no Jest.
- Tests live under `src/__tests__/*.test.ts`.
- Use Testcontainers (not mocks) for Postgres. Use MSW for outbound HTTP.

## Releasing

This monorepo uses Changesets with **independent** versioning:

```bash
pnpm changeset
# Pick packages, pick bump types, write summary.
git add .changeset/ && git commit -m "chore(release): add changeset"
git push
```

When merged to `main`, CI's `release.yml` opens a **"Version Packages"** PR consolidating all pending changesets. Merging that PR:

1. Applies version bumps + writes per-package CHANGELOG entries.
2. Runs `pnpm release` → `changeset publish` → npm with `--provenance`.
3. Creates per-package GitHub Releases with auto-generated notes.

For microservices in `apps/*`: they're `ignore`d by Changesets (apps don't publish to npm). Their releases happen via `docker-build.yml` on push to `main` — image is tagged with the short commit SHA and pushed to GHCR.

## Reporting bugs

Use the issue templates (`.github/ISSUE_TEMPLATE/`). Include:

- Repro steps.
- Expected vs actual.
- pnpm + node version (`pnpm doctor` output is gold).

## Security

Do not file public issues for security vulnerabilities. See [SECURITY.md](SECURITY.md).

## License

By contributing, you agree your contributions are licensed under [MIT](LICENSE).
